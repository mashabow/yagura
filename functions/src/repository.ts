import * as admin from "firebase-admin";
import { Product } from "./scraper";

admin.initializeApp();
const db = admin.firestore();

export const setProduct = async (product: Product) => {
  const docRef = db.collection("products").doc(product.id);
  await docRef.set({
    ...product,
    end: admin.firestore.Timestamp.fromDate(new Date(product.end)),
  });
};
