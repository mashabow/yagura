import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Scraper } from "./scraper";
import { sendProducts } from "./slack";
import { ConditionRepository } from "./repository/conditionRepository";
import { ProductRepository } from "./repository/productRepository";
import { defaultConditions } from "./model/condition";

const functionBuilder = functions.region("asia-northeast1").runWith({
  memory: "1GB",
});

const runImpl = async () => {
  admin.initializeApp();
  const db = admin.firestore();
  const conditionRepository = new ConditionRepository(db);
  const productRepository = new ProductRepository(db);

  const conditions = await conditionRepository.getAll();
  functions.logger.log("conditions", conditions);
  // 1つもなかったら作成する
  if (!conditions.length) {
    for (const condition of defaultConditions) {
      await conditionRepository.create(condition);
    }
    conditions.concat(defaultConditions);
  }

  const scraper = await Scraper.init();

  const lastStarted = await productRepository.getLastStarted();
  functions.logger.log("lastStarted", lastStarted);

  for (const condition of conditions) {
    const products = await scraper.fetchProducts(condition);
    const newProducts = lastStarted
      ? products.filter((product) => lastStarted.start < product.start)
      : products;
    functions.logger.log("newProducts", newProducts);

    for (const product of newProducts) {
      await productRepository.set(product);
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
