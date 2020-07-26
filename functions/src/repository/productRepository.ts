import * as admin from "firebase-admin";
import { Product } from "../model/product";

export class ProductRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  // 開始時刻（start）が最も新しい Product を取得
  async getLastStarted(): Promise<Product | null> {
    const productsRef = this.db.collection("products");
    const snapshot = await productsRef.orderBy("start", "desc").limit(1).get();
    const last = snapshot.docs[0]?.data();
    if (!last) return null;
    return {
      ...last,
      start: last.start.toDate().toISOString(),
      end: last.end.toDate().toISOString(),
    } as Product;
  }

  async set(product: Product): Promise<void> {
    const docRef = this.db.collection("products").doc(product.id);
    await docRef.set({
      ...product,
      start: admin.firestore.Timestamp.fromDate(new Date(product.start)),
      end: admin.firestore.Timestamp.fromDate(new Date(product.end)),
    });
  }
}
