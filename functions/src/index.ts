import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Scraper } from "./scraper";
import { sendProducts } from "./slack";
import { ConditionRepository } from "./repository/conditionRepository";
import { ProductRepository } from "./repository/productRepository";
import { defaultConditions } from "./model/condition";

admin.initializeApp();

const functionBuilder = functions.region("asia-northeast1").runWith({
  memory: "1GB",
});

const runImpl = async (): Promise<void> => {
  const db = admin.firestore();
  const conditionRepository = new ConditionRepository(db);
  const productRepository = new ProductRepository(db);

  let conditions = await conditionRepository.getAll();
  functions.logger.log("conditions.length", conditions.length);
  // 1つもなかったら作成する
  if (!conditions.length) {
    for (const condition of defaultConditions) {
      await conditionRepository.create(condition);
      conditions = conditions.concat(defaultConditions);
    }
  }

  const scraper = await Scraper.init();

  for (const condition of conditions) {
    functions.logger.log("condition", { condition });

    const lastStarted = await productRepository.getLastStarted(condition.id);
    functions.logger.log("lastStarted", { lastStarted });

    const products = await scraper.fetchProducts(condition);
    const newProducts = lastStarted
      ? products.filter((product) => lastStarted.start < product.start)
      : products;
    functions.logger.log("newProducts.length", newProducts.length);

    for (const product of newProducts) {
      await productRepository.set(condition.id, product);
    }

    if (newProducts.length) {
      await sendProducts(newProducts);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await scraper.close();
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
