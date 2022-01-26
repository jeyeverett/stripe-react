import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
export const app = initializeApp({
    credential: applicationDefault(),
}); //automatically looks for the GOOGLE_APP.. env variable
export const db = getFirestore();
export const auth = getAuth();
//# sourceMappingURL=firebase.js.map