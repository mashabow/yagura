import * as functions from "firebase-functions";
import { Scraper } from "./scraper";
import { conditions } from "./model/condition";
import { sendProducts } from "./slack";
import * as productRepository from "./repository/productRepository";

const functionBuilder = functions.region("asia-northeast1").runWith({
  memory: "1GB",
});

const runImpl = async () => {
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
