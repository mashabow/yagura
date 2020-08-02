import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { scrapeProducts } from "./scraper";
import { createSlackApp, postProducts } from "./slack";
import { ConditionRepository } from "./repository/conditionRepository";
import { ProductRepository } from "./repository/productRepository";
import { defaultConditions } from "./model/condition";
import { Product } from "./model/product";

admin.initializeApp();

const db = admin.firestore();
const conditionRepository = new ConditionRepository(db);
const productRepository = new ProductRepository(db);

const runImpl = async (): Promise<void> => {
  const storedConditions = await conditionRepository.getAll();
  functions.logger.log("storedConditions.length", storedConditions.length);
  const conditions = storedConditions.length
    ? storedConditions
    : defaultConditions;

  for (const condition of conditions) {
    functions.logger.log("condition", { condition });

    const newLastAccess = new Date();
    const products = await scrapeProducts(condition);

    const newProducts = (
      await Promise.all(
        products.map(
          async (product): Promise<Product | null> => {
            // 前回取得時にすでに開始されていた商品は無視
            if (product.start < condition.lastAccess) return null;
            const storedProduct = await productRepository.get(
              condition.id,
              product.id
            );
            // スターなしの再出品は無視
            if (storedProduct && !storedProduct.starred) return null;
            const newProduct = {
              ...product,
              ...(storedProduct && { starred: storedProduct.starred }),
            };
            await productRepository.set(condition.id, newProduct);
            return newProduct;
          }
        )
      )
    ).filter((p): p is Product => p !== null);
    functions.logger.log("newProducts", { newProducts });

    await conditionRepository.set({ ...condition, lastAccess: newLastAccess });

    if (newProducts.length) {
      await postProducts(condition, newProducts);
    } else {
      await postProducts(condition, products.slice(0, 3));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

const functionBuilder = functions.region("asia-northeast1");

export const run = functionBuilder.https.onRequest(async (req, res) => {
  await runImpl();
  res.sendStatus(200);
});

export const scheduledRun = functionBuilder.pubsub
  .schedule("every 1 hours")
  .onRun(async (context) => {
    await runImpl();
  });

export const slack = functionBuilder.https.onRequest(
  createSlackApp(productRepository)
);
