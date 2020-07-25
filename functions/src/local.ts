import { Scraper } from "./scraper";
import { sendProducts } from "./slack";
import { queries } from "./queries.example";

(async () => {
  const scraper = await Scraper.init({
    headless: false,
    slowMo: 1000,
  });

  for (const query of queries) {
    const products = await scraper.fetchProducts(query);
    console.log(products);
    await sendProducts(products);
    console.log("-".repeat(20));
  }

  await scraper.close();
})();
