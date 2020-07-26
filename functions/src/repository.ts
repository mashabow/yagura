import * as admin from "firebase-admin";
import { Product } from "./scraper";

admin.initializeApp();
const db = admin.firestore();

// 開始時刻（start）が最も新しい Product を取得
export const getLastStartedProduct = async (): Promise<Product | null> => {
  const productsRef = db.collection("products");
  const snapshot = await productsRef.orderBy("start", "desc").limit(1).get();
  const last = snapshot.docs[0]?.data();
  if (!last) return null;
  return {
    ...last,
    start: last.start.toDate().toISOString(),
    end: last.end.toDate().toISOString(),
  } as Product;
};

export const setProduct = async (product: Product) => {
  const docRef = db.collection("products").doc(product.id);
  await docRef.set({
    ...product,
    start: admin.firestore.Timestamp.fromDate(new Date(product.start)),
    end: admin.firestore.Timestamp.fromDate(new Date(product.end)),
  });
};
