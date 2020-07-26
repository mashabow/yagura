import * as admin from "firebase-admin";
import { Product } from "../model/product";

export class ProductRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  // 開始時刻（start）が最も新しい Product を取得
  async getLastStarted(conditionId: string): Promise<Product | null> {
    const productsRef = this.db
      .collection("conditions")
      .doc(conditionId)
      .collection("products");
    const snapshot = await productsRef.orderBy("start", "desc").limit(1).get();
    const last = snapshot.docs[0]?.data();
    if (!last) return null;
    return {
      ...last,
      start: last.start.toDate().toISOString(),
      end: last.end.toDate().toISOString(),
    } as Product;
  }

  async set(conditionId: string, product: Product): Promise<void> {
    const productRef = this.db
      .collection("conditions")
      .doc(conditionId)
      .collection("products")
      .doc(product.id);
    await productRef.set({
      ...product,
      start: admin.firestore.Timestamp.fromDate(new Date(product.start)),
      end: admin.firestore.Timestamp.fromDate(new Date(product.end)),
    });
  }
}
