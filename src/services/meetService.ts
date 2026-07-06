import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { validateEmailDomain } from "../lib/utils";

const MEET_SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly"
];

// Helper to get cached Meet token
export const getMeetToken = async (): Promise<string | null> => {
  const stored = localStorage.getItem("google_meet_token");
  if (stored) {
    try {
      const { token, expiresAt } = JSON.parse(stored);
      if (Date.now() < expiresAt) {
        return token;
      }
    } catch (e) {}
  }
  return null;
};

// Helper specifically to get an access token for Meet
export const signInAndGetTokenForMeet = async (): Promise<string> => {
  const provider = new GoogleAuthProvider();
  MEET_SCOPES.forEach(scope => provider.addScope(scope));

  // Forces the account selector to re-authenticate if necessary
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const email = result.user?.email || "";

    if (!validateEmailDomain(email)) {
      // Sign out from Firebase Auth to clear the personal account session
      await auth.signOut();
      throw new Error(`Este serviço só pode ser conectado com um e-mail profissional com o domínio da plataforma (@elosolucoeshumanas.com). Você tentou conectar com o e-mail pessoal: ${email}`);
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Não foi possível obter o token de acesso do Google Meet.");
    }

    // Store the meet token and meet email in localStorage
    localStorage.setItem(
      "google_meet_token",
      JSON.stringify({ token, email, expiresAt: Date.now() + 3500 * 1000 })
    );

    return token;
  } catch (error: any) {
    if (
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      throw new Error("O processo de login foi cancelado pelo usuário.");
    }
    console.error("Meet authentication error:", error);
    throw new Error(error.message || "Falha na autenticação do Google Meet.");
  }
};

// Creates a new Google Meet space
export const createMeetSpace = async (): Promise<string> => {
  let accessToken = await getMeetToken();
  if (!accessToken) {
    accessToken = await signInAndGetTokenForMeet();
  }

  const response = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error("Failed to create Meet space:", errorData);
    throw new Error("Ocorreu um erro ao se comunicar com a API do Google Meet. Por favor, verifique suas permissões.");
  }

  const data = await response.json();
  
  if (!data || !data.meetingUri) {
    throw new Error("A API do Google Meet não retornou um link válido de reunião.");
  }

  return data.meetingUri;
};

