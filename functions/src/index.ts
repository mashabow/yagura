import * as functions from "firebase-functions";
import { Scraper } from "./scraper";
import { conditions } from "./conditions.example";
import { sendProducts } from "./slack";
import * as repository from "./repository";

const functionBuilder = functions.region("asia-northeast1").runWith({
  memory: "1GB",
});

const runImpl = async () => {
  const scraper = await Scraper.init();

  const lastStarted = await repository.getLastStartedProduct();
  functions.logger.log("lastStarted", lastStarted);

  for (const condition of conditions) {
    const products = await scraper.fetchProducts(condition);
    const newProducts = lastStarted
      ? products.filter((product) => lastStarted.start < product.start)
      : products;
    functions.logger.log("newProducts", newProducts);

    for (const product of newProducts) {
      await repository.setProduct(product);
    }

    await sendProducts(newProducts);
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
