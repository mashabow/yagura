import * as puppeteer from "puppeteer";

export const scrape = async (options?: puppeteer.LaunchOptions) => {
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto('https://auctions.yahoo.co.jp/search/search?p=%E3%83%86%E3%82%B9%E3%83%88&auccat=21700&va=%E3%83%86%E3%82%B9%E3%83%88&exflg=1&b=1&n=100&mode=2');
  const items = await page.$$eval('.Product__titleLink', (elements) => (elements as HTMLElement[]).map(
    el => ({ title: el.innerText })
  ));
  console.log(items);

  await browser.close();
};
