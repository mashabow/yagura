import * as functions from "firebase-functions";
import { Scraper } from "./scraper";
import { queries } from "./queries.example";
import { sendProducts } from "./slack";

const functionBuilder = functions.region("asia-northeast1").runWith({
  memory: "1GB",
});

const runImpl = async () => {
  const scraper = await Scraper.init();

  for (const query of queries) {
    const products = await scraper.fetchProducts(query);
    functions.logger.log("products", products);
    await sendProducts(products);
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
