import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

/**
 * Firebase Admin — server-side ID token verification.
 * Only projectId is needed for verifyIdToken(): tokens are validated against
 * Google's public certificates, so no service-account key is required.
 */
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'explorewallah-81762';

if (getApps().length === 0) {
  initializeApp({ projectId: FIREBASE_PROJECT_ID });
}

export interface VerifiedFirebaseIdentity {
  uid: string;
  phone: string | null;
  email: string | null;
  name: string | null;
  signInProvider: string | null;
}

/**
 * Verifies a Firebase ID token from the client and returns the identity
 * claims Google actually signed. Throws if the token is missing/invalid/expired.
 * This is the ONLY source of truth for who the customer is — request body
 * identity fields must never be trusted.
 */
export const verifyFirebaseIdToken = async (
  authorizationHeader?: string
): Promise<VerifiedFirebaseIdentity> => {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Missing Firebase ID token');
  }

  const idToken = authorizationHeader.slice('Bearer '.length).trim();
  const decoded = await getAuth().verifyIdToken(idToken);

  return {
    uid: decoded.uid,
    phone: decoded.phone_number || null,
    email: decoded.email || null,
    name: (decoded.name as string | undefined) || null,
    signInProvider: decoded.firebase?.sign_in_provider || null,
  };
};
