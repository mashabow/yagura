import * as functions from "firebase-functions";
import { Scraper } from "./scraper";
import { queries } from "./queries.example";

export const run = functions
  .region("asia-northeast1")
  .runWith({
    memory: "1GB",
  })
  .https.onRequest(async (req, res) => {
    const scraper = await Scraper.init();

    for (const query of queries) {
      const products = await scraper.fetchProducts(query);
      functions.logger.log("products", products);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    await scraper.close();

    res.sendStatus(200);
  });
