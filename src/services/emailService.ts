/**
 * ============================================================================
 * CLIENT-SIDE EMAIL SERVICE - ELO SOLUÇÕES HUMANAS
 * ============================================================================
 * This service provides client-side integrations to trigger custom emails
 * via the secure server-side Firebase Cloud Function.
 */

// Custom email payload
export interface CustomEmailPayload {
  to: string;
  subject: string;
  title?: string;
  body: string;
}

/**
 * Triggers a custom email dispatch by calling the secure Cloud Function.
 * Keeps API keys hidden securely on the server-side.
 */
export async function sendCustomEmail(payload: CustomEmailPayload): Promise<{ success: boolean; message: string }> {
  try {
    // Dynamically retrieve the correct URL for the deployed Cloud Function.
    // In production, this points to your project's region.
    // We default to the current Firebase hosting region or a fallback.
    const projectConfig = await import("../../firebase-applet-config.json");
    const projectId = projectConfig.projectId || "ai-studio-fd9c0163-2afa-4a82-814b-c46dbea49c90";
    
    // Cloud Functions v2 onRequest defaults to us-central1 unless specified,
    // and uses the format: https://<function-name>-<hash>-uc.a.run.app
    // For convenience in development or testing, we can target the current app's serverless region.
    const functionUrl = `https://sendcustomemail-761921350625.us-central1.run.app`; // fallback production URL
    const devUrl = `http://localhost:5001/${projectId}/us-central1/sendCustomEmail`;

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const targetUrl = isLocalhost ? devUrl : functionUrl;

    console.log(`[EmailService] Dispatching custom email to ${payload.to} via ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server returned error status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || "Email enviado com sucesso!",
    };
  } catch (error: any) {
    console.error("[EmailService] Failed to send custom email:", error);
    // Return a structured error response
    return {
      success: false,
      message: error.message || "Ocorreu um erro ao disparar o e-mail.",
    };
  }
}
