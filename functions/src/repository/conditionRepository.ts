import { Condition } from "../model/condition";

export class ConditionRepository {
  constructor(private db: FirebaseFirestore.Firestore) {}

  async getAll(): Promise<readonly Condition[]> {
    const snapshot = await this.db.collection("conditions").get();
    return (snapshot.docs as any) as Condition[];
  }

  async create(condition: Condition): Promise<void> {
    const docRef = this.db.collection("conditions").doc(condition.id);
    await docRef.set(condition);
  }
}
