import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
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

  // Send Email Notification to Professional
  try {
    const profSnap = await profileRef.get();
    if (profSnap.exists) {
      const profData = profSnap.data();
      const profEmail = profData?.email;
      if (profEmail) {
        const activePlanLabel = activePlan === "yearly" ? "Anual Premiado" : "Mensal Profissional";
        const emailTitle = "Sua Assinatura está Ativa! 🚀";
        const html = getEmailTemplate(emailTitle, `
          <p>Olá, <strong>${profData?.name || "Profissional"}</strong>!</p>
          <p>Confirmamos a ativação/atualização da sua assinatura junto ao nosso processador de pagamentos Stripe.</p>
          <p>Agora, todos os benefícios e recursos premium do seu plano estão liberados para impulsionar seus atendimentos!</p>
          <div class="highlight">
            • <strong>Plano contratado:</strong> ${activePlanLabel}<br>
            • <strong>Status da Assinatura:</strong> Ativo (${dbStatus})<br>
            • <strong>Próximo Vencimento:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString("pt-BR")}
          </div>
          <p>Obrigado por confiar no nosso ecossistema para gerenciar sua clínica e atendimentos.</p>
          <br>
          <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
        `);
        await sendEmailInternal(profEmail, "Sua Assinatura está Ativa! 🚀", html);
      }
    }
  } catch (err) {
    console.warn("Could not dispatch subscription updated email:", err);
  }

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

  // Send Email Notification to Professional
  try {
    const profSnap = await profileRef.get();
    if (profSnap.exists) {
      const profData = profSnap.data();
      const profEmail = profData?.email;
      if (profEmail) {
        const emailTitle = "Confirmação de Cancelamento de Assinatura ⚠️";
        const html = getEmailTemplate(emailTitle, `
          <p>Olá, <strong>${profData?.name || "Profissional"}</strong>,</p>
          <p>Confirmamos o cancelamento da sua assinatura de serviços com a nossa plataforma.</p>
          <div class="highlight">
            • <strong>Status da conta:</strong> Canceled / Inativa<br>
            • <strong>Data de Encerramento:</strong> ${new Date().toLocaleDateString("pt-BR")}
          </div>
          <p>Sua conta foi migrada para o plano básico de leitura. Você pode reativar seu plano profissional a qualquer momento acessando seu painel e reiniciando a assinatura para recuperar o acesso completo à criação de novos pacientes, empresas e consultas.</p>
          <p>Agradecemos imensamente pelo tempo em que estivemos juntos. Se houver algo que possamos fazer para melhorar, responda a este e-mail ou fale com o suporte!</p>
          <br>
          <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
        `);
        await sendEmailInternal(profEmail, "Confirmação de Cancelamento de Assinatura ⚠️", html);
      }
    }
  } catch (err) {
    console.warn("Could not dispatch subscription canceled email:", err);
  }

  try {
    const notifCollectionRef = profileRef.collection("system_notifications");
    await notifCollectionRef.add({
      title: "Assinatura Cancelada ⚠️",
      message: "Sua assinatura foi cancelada junto ao gateway de pagamentos Stripe. Sinta-se à voltar para reativar seu plano a qualquer momento no gerenciador de assinaturas.",
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

/**
 * ============================================================================
 * EMAIL SYSTEM - ELO SOLUÇÕES HUMANAS
 * ============================================================================
 */

/**
 * Centralized layout template generator for all platform emails.
 * Uses a gorgeous theme matching the platform's amber/slate aesthetic.
 */
function getEmailTemplate(title: string, contentHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 20px;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #f59e0b;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          padding: 32px 24px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 32px 24px;
          line-height: 1.6;
          font-size: 16px;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .btn {
          display: inline-block;
          background-color: #d97706;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
          text-align: center;
        }
        .highlight {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px 16px;
          border-radius: 4px;
          margin: 16px 0;
        }
        .text-muted {
          font-size: 14px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Elo Soluções Humanas. Todos os direitos reservados.</p>
          <p>Esta é uma notificação automática da plataforma. Por favor, não responda a este e-mail.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Dispatcher function that chooses between Resend, Brevo, or falling back to a Sandbox log.
 */
async function sendEmailInternal(toEmail: string, subject: string, htmlContent: string): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "no-reply@suaplataforma.com";

  console.log(`[sendEmailInternal] Attempting to send email to ${toEmail} with subject: "${subject}"`);

  // Log a record in Firestore for debug and audit tracking
  try {
    await db.collection("sent_emails_history").add({
      to: toEmail,
      subject: subject,
      sentAt: new Date().toISOString(),
      providerUsed: resendApiKey ? "resend" : brevoApiKey ? "brevo" : "debug_console"
    });
  } catch (e) {
    console.error("Error saving sent email to history:", e);
  }

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [toEmail],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend API returned status ${response.status}: ${errText}`);
      }
      console.log(`[sendEmailInternal] Email successfully sent via Resend API to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`[sendEmailInternal] Failed to send email via Resend: ${err.message}`);
    }
  }

  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Elo Soluções Humanas", email: emailFrom },
          to: [{ email: toEmail }],
          subject: subject,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Brevo API returned status ${response.status}: ${errText}`);
      }
      console.log(`[sendEmailInternal] Email successfully sent via Brevo API to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error(`[sendEmailInternal] Failed to send email via Brevo: ${err.message}`);
    }
  }

  // Fallback / Sandbox mode
  console.warn(`[sendEmailInternal] No email provider (RESEND_API_KEY or BREVO_API_KEY) configured in environment variables. Running in sandbox/debug mode.`);
  console.log(`==== SANDBOX EMAIL EMULATOR ====`);
  console.log(`To: ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content (HTML snippet):\n${htmlContent.substring(0, 500)}...\n=================================`);

  // Write to a sandbox_emails collection so user can see it in real-time in the database!
  try {
    await db.collection("sandbox_emails").add({
      to: toEmail,
      subject: subject,
      htmlContent: htmlContent,
      sentAt: new Date().toISOString(),
      instruction: "To send real emails, add RESEND_API_KEY or BREVO_API_KEY to your environment variables."
    });
  } catch (e) {
    console.error("Error creating sandbox email log:", e);
  }

  return true;
}

/**
 * 1. TRIGGER: Patient Welcome Email (onClientCreated)
 */
export const onClientCreated = onDocumentCreated("profiles/{userId}/clients/{clientId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const clientData = snapshot.data();
  const userId = event.params.userId;

  const toEmail = clientData.email;
  if (!toEmail) return;

  // Fetch therapist/professional profile
  let professionalName = "Profissional de Saúde";
  try {
    const profSnap = await db.collection("profiles").doc(userId).get();
    if (profSnap.exists) {
      professionalName = profSnap.data()?.name || professionalName;
    }
  } catch (err) {
    console.error("Error fetching professional profile for client welcome email:", err);
  }

  const title = "Boas-vindas ao seu Espaço de Cuidado! 🌱";
  const html = getEmailTemplate(title, `
    <p>Olá, <strong>${clientData.name || "Paciente"}</strong>!</p>
    <p>É com muita alegria que damos as boas-vindas à nossa plataforma de atendimento.</p>
    <p>Seu perfil foi criado com sucesso por <strong>${professionalName}</strong>, garantindo que todo o seu acompanhamento ocorra em um espaço seguro, moderno e totalmente focado no seu bem-estar.</p>
    
    <div class="highlight">
      <strong>Benefícios do acompanhamento na plataforma:</strong>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Acompanhamento de consultas em tempo real</li>
        <li>Acesso facilitado a relatórios e materiais de orientação</li>
        <li>Comunicação integrada, transparente e segura</li>
        <li>Controle de faturamentos e pagamentos de forma simplificada</li>
      </ul>
    </div>

    <p>Se tiver qualquer dúvida ou necessitar de suporte, sinta-se à vontade para entrar em contato diretamente com seu profissional: <strong>${professionalName}</strong>.</p>
    <p>Estamos entusiasmados em apoiar sua jornada de desenvolvimento.</p>
    <br>
    <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
  `);

  await sendEmailInternal(toEmail, "Seu cadastro foi realizado com sucesso! 🌱", html);
});

/**
 * 2. TRIGGER: Company Welcome Email (onCompanyCreated)
 */
export const onCompanyCreated = onDocumentCreated("profiles/{userId}/companies/{companyId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const companyData = snapshot.data();
  const userId = event.params.userId;

  const toEmail = companyData.email;
  if (!toEmail) return;

  let professionalName = "Profissional de Saúde";
  try {
    const profSnap = await db.collection("profiles").doc(userId).get();
    if (profSnap.exists) {
      professionalName = profSnap.data()?.name || professionalName;
    }
  } catch (err) {
    console.error("Error fetching professional profile for company welcome email:", err);
  }

  const title = "Parceria Confirmada: Empresa Cadastrada! 🏢";
  const html = getEmailTemplate(title, `
    <p>Olá, equipe da <strong>${companyData.name || "Empresa"}</strong>!</p>
    <p>Temos o prazer de confirmar que a sua empresa foi cadastrada com sucesso em nossa plataforma de gestão e desenvolvimento organizacional.</p>
    <p>Este cadastro foi efetuado por <strong>${professionalName}</strong> e marca o início de uma excelente jornada de colaboração e acompanhamento institucional.</p>
    
    <div class="highlight">
      <strong>O que sua empresa ganha com isso?</strong>
      <ul style="margin: 8px 0; padding-left: 20px;">
        <li>Painel exclusivo de acompanhamento e indicadores de desenvolvimento</li>
        <li>Controle simplificado de sessões, consultorias e treinamentos agendados</li>
        <li>Transparência total na gestão financeira de contratos e faturamentos</li>
        <li>Acesso a relatórios de impacto de forma rápida e segura</li>
      </ul>
    </div>

    <p>Estamos ansiosos para colaborar ativamente para o sucesso e bem-estar dos seus colaboradores e equipes.</p>
    <p>Sejam muito bem-vindos!</p>
    <br>
    <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
  `);

  await sendEmailInternal(toEmail, "Parceria Confirmada: Cadastro Realizado! 🏢", html);
});

/**
 * 3. TRIGGER: Appointment Created Trigger (onAppointmentCreated)
 */
export const onAppointmentCreated = onDocumentCreated("profiles/{userId}/appointments/{apptId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const apptData = snapshot.data();
  const userId = event.params.userId;

  const clientId = apptData.clientId;
  if (!clientId) return;

  // Fetch client details
  let clientEmail = "";
  let clientName = apptData.clientName || "Paciente";
  try {
    const clientSnap = await db.collection("profiles").doc(userId).collection("clients").doc(clientId).get();
    if (clientSnap.exists) {
      clientEmail = clientSnap.data()?.email || "";
      clientName = clientSnap.data()?.name || clientName;
    }
  } catch (err) {
    console.error("Error fetching client details for appointment email:", err);
  }

  if (!clientEmail) return;

  // Fetch therapist details
  let professionalName = "Profissional de Saúde";
  try {
    const profSnap = await db.collection("profiles").doc(userId).get();
    if (profSnap.exists) {
      professionalName = profSnap.data()?.name || professionalName;
    }
  } catch (err) {
    console.error("Error fetching professional profile:", err);
  }

  // Parse datetime
  let formattedDateStr = "Data a confirmar";
  try {
    if (apptData.datetime) {
      const d = new Date(apptData.datetime);
      formattedDateStr = d.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo"
      });
    }
  } catch (e) {
    console.warn("Could not format appointment date:", e);
  }

  const title = "Consulta Agendada! 🗓️";
  const html = getEmailTemplate(title, `
    <p>Olá, <strong>${clientName}</strong>!</p>
    <p>Passando para confirmar que sua próxima sessão de atendimento foi agendada com sucesso.</p>
    
    <div class="highlight" style="font-size: 16px;">
      <strong>Detalhes do Agendamento:</strong><br>
      • <strong>Profissional:</strong> ${professionalName}<br>
      • <strong>Data/Hora:</strong> ${formattedDateStr}<br>
      • <strong>Observações:</strong> ${apptData.notes || "Sessão padrão"}
    </div>

    <p>Caso precise alterar ou desmarcar o seu horário, por favor, entre em contato com pelo menos 24 horas de antecedência para melhor reorganização da agenda.</p>
    <p>Desejamos a você um excelente atendimento!</p>
    <br>
    <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
  `);

  await sendEmailInternal(clientEmail, `Consulta Agendada: ${formattedDateStr} 🗓️`, html);
});

/**
 * 4. TRIGGER: Appointment Updated / Payment / Rescheduling Trigger (onAppointmentUpdated)
 */
export const onAppointmentUpdated = onDocumentUpdated("profiles/{userId}/appointments/{apptId}", async (event) => {
  const before = event.data?.before;
  const after = event.data?.after;
  if (!before || !after) return;

  const dataBefore = before.data();
  const dataAfter = after.data();
  const userId = event.params.userId;

  const clientId = dataAfter.clientId;
  if (!clientId) return;

  // Detect payment status change (unpaid -> paid)
  const paymentChangedToPaid = 
    (dataBefore.paymentStatus !== "paid" && dataBefore.paymentStatus !== "pago") && 
    (dataAfter.paymentStatus === "paid" || dataAfter.paymentStatus === "pago");

  // Detect date change
  const dateChanged = dataBefore.datetime !== dataAfter.datetime;

  if (!paymentChangedToPaid && !dateChanged) return;

  // Fetch client details
  let clientEmail = "";
  let clientName = dataAfter.clientName || "Paciente";
  try {
    const clientSnap = await db.collection("profiles").doc(userId).collection("clients").doc(clientId).get();
    if (clientSnap.exists) {
      clientEmail = clientSnap.data()?.email || "";
      clientName = clientSnap.data()?.name || clientName;
    }
  } catch (err) {
    console.error("Error fetching client details for appointment update:", err);
  }

  if (!clientEmail) return;

  // Fetch professional details
  let professionalName = "Profissional de Saúde";
  try {
    const profSnap = await db.collection("profiles").doc(userId).get();
    if (profSnap.exists) {
      professionalName = profSnap.data()?.name || professionalName;
    }
  } catch (err) {
    console.error("Error fetching professional profile:", err);
  }

  // Parse datetime
  let formattedDateStr = "Data a confirmar";
  try {
    if (dataAfter.datetime) {
      const d = new Date(dataAfter.datetime);
      formattedDateStr = d.toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo"
      });
    }
  } catch (e) {
    console.warn("Could not format date:", e);
  }

  if (paymentChangedToPaid) {
    const title = "Pagamento Confirmado! 💳";
    const html = getEmailTemplate(title, `
      <p>Olá, <strong>${clientName}</strong>!</p>
      <p>Confirmamos o recebimento do pagamento referente à sua sessão de atendimento com o profissional <strong>${professionalName}</strong>.</p>
      
      <div class="highlight">
        • <strong>Sessão correspondente:</strong> ${formattedDateStr}<br>
        • <strong>Valor recebido:</strong> R$ ${(dataAfter.totalAmount || 0).toFixed(2)}<br>
        • <strong>Status da transação:</strong> Confirmado com Sucesso
      </div>

      <p>Seu histórico financeiro foi devidamente atualizado no painel de acompanhamento.</p>
      <p>Agradecemos imensamente pela pontualidade e confiança!</p>
      <br>
      <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
    `);

    await sendEmailInternal(clientEmail, "Confirmação de Pagamento Recebido! 💳", html);
  } else if (dateChanged) {
    const title = "Reagendamento de Consulta 🔄";
    const html = getEmailTemplate(title, `
      <p>Olá, <strong>${clientName}</strong>!</p>
      <p>Informamos que o horário da sua próxima sessão com o profissional <strong>${professionalName}</strong> foi alterado.</p>
      
      <div class="highlight" style="font-size: 16px;">
        <strong>Novo Horário Confirmado:</strong><br>
        • <strong>Profissional:</strong> ${professionalName}<br>
        • <strong>Data/Hora:</strong> ${formattedDateStr}<br>
        • <strong>Observações:</strong> ${dataAfter.notes || "Reagendamento efetuado pelo profissional"}
      </div>

      <p>Caso tenha qualquer impedimento com esse novo horário, solicitamos que entre em contato imediatamente.</p>
      <br>
      <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
    `);

    await sendEmailInternal(clientEmail, `Consulta Reagendada: ${formattedDateStr} 🔄`, html);
  }
});

/**
 * 5. CRON SCHEDULER: Daily Subscription Renewal Check
 * Runs daily at 8:00 AM UTC. Checks for active subscriptions expiring in exactly 7 days.
 */
export const dailySubscriptionCheck = onSchedule("0 8 * * *", async (event) => {
  console.log("[dailySubscriptionCheck] Starting daily verification of near-expiry subscriptions...");
  const now = new Date();
  
  // 7 days from now
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  try {
    const profilesSnap = await db.collection("profiles")
      .where("subscriptionStatus", "==", "active")
      .get();

    if (profilesSnap.empty) {
      console.log("[dailySubscriptionCheck] No active subscriptions found to check.");
      return;
    }

    let emailsSentCount = 0;
    for (const docSnap of profilesSnap.docs) {
      const profileData = docSnap.data();
      const expiresAtStr = profileData.subscriptionExpiresAt;
      if (!expiresAtStr) continue;

      const expiresAt = new Date(expiresAtStr);
      const diffTime = expiresAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If subscription expires in exactly 7 days, send a renewal warning
      if (diffDays === 7) {
        const toEmail = profileData.email;
        if (!toEmail) continue;

        const formattedExpiry = expiresAt.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });

        const title = "Aviso de Renovação de Assinatura 🔔";
        const html = getEmailTemplate(title, `
          <p>Olá, <strong>${profileData.name || "Profissional"}</strong>!</p>
          <p>Esperamos que você esteja tendo uma excelente experiência em nossa plataforma!</p>
          <p>Este é um lembrete de que sua assinatura do plano <strong>${profileData.activePlan === "yearly" ? "Anual Premiado" : "Mensal Profissional"}</strong> está programada para renovar automaticamente em <strong>${formattedExpiry}</strong> (em exatamente 7 dias).</p>
          
          <div class="highlight">
            <strong>Detalhes da Renovação:</strong><br>
            • <strong>Plano contratado:</strong> ${profileData.activePlan === "yearly" ? "Anual Premiado" : "Mensal Profissional"}<br>
            • <strong>Data de Cobrança:</strong> ${formattedExpiry}<br>
            • <strong>Valor da Renovação:</strong> R$ ${(profileData.subscriptionPrice || 0).toFixed(2)}
          </div>

          <p>Caso precise alterar seu plano, gerenciar suas formas de pagamento ou revisar suas configurações, acesse a aba "Meu Perfil > Assinatura" em seu painel.</p>
          <p>Muito obrigado por continuar conosco impulsionando seus atendimentos!</p>
          <br>
          <p>Atenciosamente,<br><strong>Equipe Elo Soluções Humanas</strong></p>
        `);

        await sendEmailInternal(toEmail, "Aviso de Renovação de Assinatura (7 dias) 🔔", html);
        emailsSentCount++;
      }
    }
    console.log(`[dailySubscriptionCheck] Verification completed. ${emailsSentCount} renewal warnings dispatched.`);
  } catch (error) {
    console.error("[dailySubscriptionCheck] Error verifying subscriptions:", error);
  }
});

/**
 * 6. HTTPS API ENDPOINT: Manual Custom Email Dispatches
 */
export const sendCustomEmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { to, subject, title, body } = req.body;
  if (!to || !subject || !body) {
    res.status(400).send("Missing required parameters: to, subject, body");
    return;
  }

  try {
    const html = getEmailTemplate(title || subject, `<p>${body.replace(/\n/g, "<br>")}</p>`);
    await sendEmailInternal(to, subject, html);
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err: any) {
    res.status(500).send(`Error sending email: ${err.message}`);
  }
});
