import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Lazy initialization of Stripe SDK client to handle missing environment configurations gracefully
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required.");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeClient;
}

/**
 * Resolves the Firestore userId/profile Document reference dynamically.
 * Attempts to:
 * 1. Find userId in metadata or client_reference_id
 * 2. Find profile where stripeCustomerId matches
 * 3. Find profile where email matches
 */
async function findProfileRef(
  metadataUserId?: string | null,
  clientRefId?: string | null,
  stripeCustomerId?: string | null,
  customerEmail?: string | null
): Promise<admin.firestore.DocumentReference | null> {
  const targetUid = metadataUserId || clientRefId;
  if (targetUid) {
    const directRef = db.collection("profiles").doc(targetUid);
    const docSnap = await directRef.get();
    if (docSnap.exists) {
      return directRef;
    }
  }

  if (stripeCustomerId) {
    const customerSnap = await db.collection("profiles")
      .where("stripeCustomerId", "==", stripeCustomerId)
      .limit(1)
      .get();
    if (!customerSnap.empty) {
      return customerSnap.docs[0].ref;
    }
  }

  if (customerEmail) {
    const emailSnap = await db.collection("profiles")
      .where("email", "==", customerEmail)
      .limit(1)
      .get();
    if (!emailSnap.empty) {
      return emailSnap.docs[0].ref;
    }
  }

  return null;
}

/**
 * Stripe Webook listener. Handles secure event signatures and updatesFirestore statuses automatically.
 */
export const stripeWebhook = onRequest({
  cors: true,
}, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    res.status(400).send("Missing stripe-signature header");
    return;
  }

  let event: Stripe.Event;

  try {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET environment variable is not defined. Webhook signature is NOT validated in sandbox/dev mode!");
      event = req.body;
    } else {
      const stripe = getStripe();
      if (!req.rawBody) {
        throw new Error("Missing raw request body needed for Stripe signature parsing");
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
    }
  } catch (err: any) {
    console.error(`Webhook Event Construction Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log(`Received Stripe Webhook Event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(`Error processing Stripe event ${event.type}:`, error);
    res.status(500).send(`Internal database error processing event: ${error.message}`);
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripe();
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email;
  const subscriptionId = session.subscription as string;

  console.log(`[checkout.session.completed] Processing session: ${session.id}, User: ${userId}`);

  let resolvedEmail = customerEmail;
  if (!resolvedEmail && customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      resolvedEmail = customer.email;
    } catch (e) {
      console.warn("Failed to retrieve customer email from Stripe API:", e);
    }
  }

  const profileRef = await findProfileRef(
    session.metadata?.userId,
    userId,
    customerId,
    resolvedEmail
  );

  if (!profileRef) {
    console.error(`Could not locate a therapist profile for Checkout Session: ${session.id}`);
    return;
  }

  const updateData: any = {
    stripeCustomerId: customerId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (subscriptionId) {
    updateData.stripeSubscriptionId = subscriptionId;
  }

  await profileRef.update(updateData);
  console.log(`Successfully linked Stripe Customer ID ${customerId} to Profile ${profileRef.id}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripe = getStripe();
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const priceAmount = (subscription.items.data[0]?.price.unit_amount || 0) / 100;

  console.log(`[subscription.updated] Processing: ${subscriptionId} for Customer: ${customerId}`);

  let customerEmail: string | null = null;
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    customerEmail = customer.email;
  } catch (e) {
    console.warn("Failed to fetch customer email:", e);
  }

  const profileRef = await findProfileRef(
    subscription.metadata?.userId,
    null,
    customerId,
    customerEmail
  );

  if (!profileRef) {
    console.error(`No therapist profile found matching Stripe subscription update: ${subscriptionId}`);
    return;
  }

  const planInterval = subscription.items.data[0]?.price.recurring?.interval;
  const activePlan = planInterval === "year" ? "yearly" : "monthly";

  let dbStatus = "past_due";
  if (subscription.status === "active") {
    dbStatus = "active";
  } else if (subscription.status === "trialing") {
    dbStatus = "trial";
  } else if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
    dbStatus = "canceled";
  }

  const subscriptionData: any = {
    subscriptionStatus: dbStatus,
    activePlan: activePlan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionPrice: priceAmount,
    subscriptionStartedAt: new Date(subscription.start_date * 1000).toISOString(),
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000).toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (subscription.trial_end) {
    subscriptionData.trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
  }

  await profileRef.update(subscriptionData);
  console.log(`Synchronized subscription information for Profile ${profileRef.id}, Status: ${dbStatus}`);

  try {
    const notifCollectionRef = profileRef.collection("system_notifications");
    await notifCollectionRef.add({
      title: "Assinatura Sincronizada 🔄",
      message: `Recebemos uma atualização de assinatura do Stripe. Seu plano atual foi configurado como '${activePlan === "yearly" ? "Anual Premiado" : "Mensal Profissional"}' com status: '${dbStatus === "active" ? "Ativo" : "Pendente"}'.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Could not create system notification:", e);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;

  console.log(`[subscription.deleted] Processing: ${subscriptionId} for Customer: ${customerId}`);

  const profileRef = await findProfileRef(
    subscription.metadata?.userId,
    null,
    customerId,
    null
  );

  if (!profileRef) {
    console.error(`No therapist profile found matching Stripe subscription cancelation: ${subscriptionId}`);
    return;
  }

  await profileRef.update({
    subscriptionStatus: "canceled",
    stripeSubscriptionId: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Stripe subscription ${subscriptionId} canceled. Downgraded Firestore Profile ${profileRef.id} status to 'canceled'.`);

  try {
    const notifCollectionRef = profileRef.collection("system_notifications");
    await notifCollectionRef.add({
      title: "Assinatura Cancelada ⚠️",
      message: "Sua assinatura foi cancelada junto ao gateway de pagamentos Stripe. Sinta-se à vontade para reativar seu plano a qualquer momento no gerenciador de assinaturas.",
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Could not create system notification:", e);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const amountPaid = invoice.amount_paid / 100;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  console.log(`[invoice.payment_succeeded] Payment of R$ ${amountPaid} for customer ${customerId}`);

  const profileRef = await findProfileRef(
    invoice.subscription_details?.metadata?.userId,
    null,
    customerId,
    invoice.customer_email
  );

  if (!profileRef) {
    console.warn(`Could not locate user for payment success invoice: ${invoice.id}`);
    return;
  }

  await profileRef.update({
    lastPaymentDate: new Date().toISOString(),
    subscriptionStatus: "active",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Successfully updated payment history for Profile ${profileRef.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  console.log(`[invoice.payment_failed] Payment failed for customer ${customerId}`);

  const profileRef = await findProfileRef(
    invoice.subscription_details?.metadata?.userId,
    null,
    customerId,
    invoice.customer_email
  );

  if (!profileRef) {
    console.warn(`Could not locate user for payment failed invoice: ${invoice.id}`);
    return;
  }

  await profileRef.update({
    subscriptionStatus: "past_due",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Subscription set to 'past_due' status for Profile ${profileRef.id} due to failed payment.`);

  try {
    const notifCollectionRef = profileRef.collection("system_notifications");
    await notifCollectionRef.add({
      title: "Falha no Pagamento 💳",
      message: "O Stripe detectou uma falha ao tentar efetuar a cobrança periódica da sua assinatura. Por favor, revise os dados do seu cartão cadastrado para evitar a suspensão da sua conta.",
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Could not create system notification:", e);
  }
}
