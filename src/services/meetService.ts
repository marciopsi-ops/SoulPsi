import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const MEET_SCOPES = [
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly"
];

// Helper specifically to get an access token for Meet
export const signInAndGetTokenForMeet = async (): Promise<string> => {
  const provider = new GoogleAuthProvider();
  MEET_SCOPES.forEach(scope => provider.addScope(scope));

  // Forces the account selector to re-authenticate if necessary
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Unable to obtain Google Meet access token.");
    }
    return token;
  } catch (error: any) {
    if (
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/popup-closed-by-user"
    ) {
      throw new Error("Login process cancelled by user.");
    }
    console.error("Meet authentication error:", error);
    throw new Error(error.message || "Authentication failed.");
  }
};

// Creates a new Google Meet space
export const createMeetSpace = async (): Promise<string> => {
  const accessToken = await signInAndGetTokenForMeet();

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
    throw new Error("We encountered an error while communicating with Google Meet API.");
  }

  const data = await response.json();
  
  if (!data || !data.meetingUri) {
    throw new Error("Google Meet API did not return a valid meeting URI.");
  }

  return data.meetingUri;
};
