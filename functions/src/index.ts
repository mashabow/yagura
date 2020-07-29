import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { scrapeProducts } from "./scraper";
import { slackApp, sendProducts } from "./slack";
import { ConditionRepository } from "./repository/conditionRepository";
import { ProductRepository } from "./repository/productRepository";
import { defaultConditions } from "./model/condition";

admin.initializeApp();

const functionBuilder = functions.region("asia-northeast1");

const runImpl = async (): Promise<void> => {
  const db = admin.firestore();
  const conditionRepository = new ConditionRepository(db);
  const productRepository = new ProductRepository(db);

  const storedConditions = await conditionRepository.getAll();
  functions.logger.log("storedConditions.length", storedConditions.length);
  const conditions = storedConditions.length
    ? storedConditions
    : defaultConditions;

  for (const condition of conditions) {
    functions.logger.log("condition", { condition });

    const newLastAccess = new Date();
    const products = await scrapeProducts(condition);
    const newProducts = products.filter(
      (product) => condition.lastAccess < product.start
    );
    functions.logger.log("newProducts.length", newProducts.length);

    for (const product of newProducts) {
      await productRepository.set(condition.id, product);
    }
    await conditionRepository.set({ ...condition, lastAccess: newLastAccess });

    if (newProducts.length) {
      await sendProducts(condition, newProducts);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

export const run = functionBuilder.https.onRequest(async (req, res) => {
  await runImpl();
  res.sendStatus(200);
});

export const scheduledRun = functionBuilder.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    await runImpl();
  });

export const slack = functionBuilder.https.onRequest(slackApp);
