import * as admin from "firebase-admin";
import { Product } from "../model/product";

export class ProductRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async get(conditionId: string, productId: string): Promise<Product | null> {
    const productRef = this.db
      .collection("conditions")
      .doc(conditionId)
      .collection("products")
      .doc(productId);
    const doc = await productRef.get();
    const data = doc.data();
    if (!data) return null;
    return {
      ...data,
      start: data.start.toDate(),
      end: data.end.toDate(),
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
      start: admin.firestore.Timestamp.fromDate(product.start),
      end: admin.firestore.Timestamp.fromDate(product.end),
    });
  }
}
