import * as puppeteer from "puppeteer";

export class Scraper {
  private page?: puppeteer.Page;

  private constructor() {}

  static async init(options?: puppeteer.LaunchOptions): Promise<Scraper> {
    const scraper = new Scraper();
    const browser = await puppeteer.launch(options);
    scraper.page = await browser.newPage();
    return scraper;
  }

  async fetchProducts(): Promise<{}> {
    if (!this.page) throw new Error("Scraper not initialized");

    await this.page.goto(
      "https://auctions.yahoo.co.jp/search/search?p=%E3%83%86%E3%82%B9%E3%83%88&auccat=21700&va=%E3%83%86%E3%82%B9%E3%83%88&exflg=1&b=1&n=100&mode=2"
    );

    return await this.page.$$eval(".Product", ($products) =>
      ($products as HTMLElement[])
        .map(($product) => {
          const $title = $product.querySelector<HTMLElement>(
            ".Product__titleLink"
          );
          if (!$title) return null;
          const ylk = Object.fromEntries(
            $title.dataset.ylk?.split(";").map((s) => s.split(":")) ?? []
          );

          const $price = $product.querySelector<HTMLElement>(
            ".Product__priceValue"
          );
          const price = parseInt($price!.innerText.replaceAll(/[,円]/g, ""));

          const image = $product
            .querySelector<HTMLElement>(".Product__imageData")
            ?.getAttribute("src");

          const seller = $product.querySelector<HTMLElement>(".Product__seller")
            ?.innerText;

          return {
            id: ylk.cid,
            title: $title.innerText,
            price,
            image,
            seller,
            end: new Date(parseInt(ylk.end) * 1000).toISOString(),
          };
        })
        .filter((product) => product)
    );
  }

  async close(): Promise<void> {
    await this.page?.browser().close();
  }
}
