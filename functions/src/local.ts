import { Scraper } from "./scraper";

(async () => {
  const scraper = await Scraper.init({
    headless: false,
  });
  const products = await scraper.fetchProducts();
  console.log(products);
  await scraper.close();
})();
