import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { Condition, toURL } from "./model/condition";
import { Product } from "./model/product";

export const scrapeProducts = async (
  condition: Condition
): Promise<readonly Product[]> => {
  const res = await fetch(toURL(condition));
  const html = await res.text();
  const document = new JSDOM(html).window.document;

  return [...document.querySelectorAll(".Product")]
    .map(($product): Product | null => {
      const $title = $product.querySelector<HTMLElement>(".Product__titleLink");
      if (!$title) return null;
      const title = $title.innerText;

      const ylk = Object.fromEntries(
        $title.dataset.ylk?.split(";").map((s) => s.split(":")) ?? []
      ) as Record<string, string | undefined>;
      const { cid: id, st: startUnixTime, end: endUnixTime } = ylk;
      if (!id || !endUnixTime || !startUnixTime) return null;
      const start = new Date(parseInt(startUnixTime) * 1000).toISOString();
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
        start,
        end,
      };
    })
    .filter((product): product is Product => product !== null);
};
