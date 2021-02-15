import * as admin from "firebase-admin";
import { Product } from "../model/product";

export class ProductRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async set(conditionId: string, product: Product): Promise<void> {
    const productRef = this.db
      .collection("conditions")
      .doc(conditionId)
      .collection("products")
      .doc(product.id);
    await productRef.set({
      ...product,
      start: admin.firestore.Timestamp.fromDate(product.start),
      end: admin.firestore.Timestamp.fromDate(product.end),
    });
  }
}
