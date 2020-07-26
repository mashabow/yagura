import * as puppeteer from "puppeteer";

export interface Query {
  readonly keyword: string;
  readonly category: number; // auccat
}

export interface Product {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly image: string;
  readonly seller: string;
  readonly end: string;
}

export class Scraper {
  private page?: puppeteer.Page;

  private constructor() {}

  static async init(options?: puppeteer.LaunchOptions): Promise<Scraper> {
    const scraper = new Scraper();
    const browser = await puppeteer.launch(options);
    scraper.page = await browser.newPage();
    return scraper;
  }

  async fetchProducts(query: Query): Promise<readonly Product[]> {
    if (!this.page) throw new Error("Scraper not initialized");

    const encodedKeyword = encodeURIComponent(query.keyword);
    await this.page.goto(
      `https://auctions.yahoo.co.jp/search/search?p=${encodedKeyword}&auccat=${query.category}&va=${encodedKeyword}&exflg=1&b=1&n=100&mode=2`
    );

    return await this.page.$$eval(".Product", ($products) =>
      ($products as HTMLElement[])
        .map(($product): Product | null => {
          const $title = $product.querySelector<HTMLElement>(
            ".Product__titleLink"
          );
          if (!$title) return null;
          const title = $title.innerText;

          const ylk = Object.fromEntries(
            $title.dataset.ylk?.split(";").map((s) => s.split(":")) ?? []
          ) as Record<string, string | undefined>;
          const { cid: id, end: endUnixTime } = ylk;
          if (!id || !endUnixTime) return null;
          const end = new Date(parseInt(endUnixTime) * 1000).toISOString();

          const $price = $product.querySelector<HTMLElement>(
            ".Product__priceValue"
          );
          if (!$price) return null;
          const price = parseInt($price.innerText.replaceAll(/[,円]/g, ""));

          const image = $product
            .querySelector<HTMLElement>(".Product__imageData")
            ?.getAttribute("src");
          if (!image) return null;

          const seller = $product.querySelector<HTMLElement>(".Product__seller")
            ?.innerText;
          if (!seller) return null;

          return {
            id,
            title,
            price,
            image,
            seller,
            end,
          };
        })
        .filter((product): product is Product => product !== null)
    );
  }

  async close(): Promise<void> {
    await this.page?.browser().close();
  }
}
