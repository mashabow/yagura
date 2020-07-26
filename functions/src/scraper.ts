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
      if (!$title || !$title.textContent) return null;
      const title = $title.textContent;

      const ylk =
        $title.dataset.ylk
          ?.split(";")
          .map((s) => s.split(":"))
          .reduce(
            (acc, [k, v]) => ({ ...acc, [k]: v }),
            {} as Record<string, string | undefined>
          ) ?? {};
      const { cid: id, st: startUnixTime, end: endUnixTime } = ylk;
      if (!id || !endUnixTime || !startUnixTime) return null;
      const start = new Date(parseInt(startUnixTime) * 1000).toISOString();
      const end = new Date(parseInt(endUnixTime) * 1000).toISOString();

      const $price = $product.querySelector<HTMLElement>(
        ".Product__priceValue"
      );
      if (!$price || !$price.textContent) return null;
      const price = parseInt($price.textContent.replace(/[,円]/g, ""));

      const image = $product
        .querySelector<HTMLElement>(".Product__imageData")
        ?.getAttribute("src");
      if (!image) return null;

      const seller = $product.querySelector<HTMLElement>(".Product__seller")
        ?.textContent;
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
