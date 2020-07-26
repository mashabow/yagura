import * as admin from "firebase-admin";
import { Condition } from "../model/condition";

export class ConditionRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async getAll(): Promise<readonly Condition[]> {
    const snapshot = await this.db.collection("conditions").get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        lastAccess: data.lastAccess.toDate(),
      } as Condition;
    });
  }

  async set(condition: Condition): Promise<void> {
    const docRef = this.db.collection("conditions").doc(condition.id);
    await docRef.set({
      ...condition,
      lastAccess: admin.firestore.Timestamp.fromDate(condition.lastAccess),
    });
  }
}
