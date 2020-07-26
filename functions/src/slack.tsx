/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Blocks,
  Section,
  Image,
  Field,
  Divider,
} from "@speee-js/jsx-slack";

import * as functions from "firebase-functions";
import { IncomingWebhook } from "@slack/webhook";
import { Product } from "./model/product";
import { Condition, toURL } from "./model/condition";

const url: string | undefined = functions.config().slack?.webhook_url;
if (!url) throw new Error("slack.webhook_url not set");

const webhook = new IncomingWebhook(url);

// Slack が受け付ける blocks は最大 50 要素なので、それ以下にしておく
const MAX_PRODUCTS = 20;

export const sendProducts = async (
  condition: Condition,
  products: readonly Product[]
): Promise<void> => {
  const blocks = JSXSlack(
    <Blocks>
      <Section>
        🔍 検索条件{" "}
        <a href={toURL(condition)}>
          <code>{condition.keyword}</code>
        </a>
      </Section>
      {products.slice(0, MAX_PRODUCTS).map((product) => (
        <Section>
          <strong>
            <a
              href={`https://page.auctions.yahoo.co.jp/jp/auction/${product.id}`}
            >
              {product.title}
            </a>
          </strong>
          <Field>💰 {product.price.toLocaleString()}円</Field>
          <Field>👤 {product.seller}</Field>
          <Field>
            🕒 <time dateTime={product.end}>{"{date_pretty} {time}"}</time>
          </Field>
          <Image src={product.image} alt="商品画像" />
        </Section>
      ))}
      {products.length > MAX_PRODUCTS && (
        <Section>ほか {products.length - MAX_PRODUCTS} 件</Section>
      )}
      <Divider />
    </Blocks>
  );

  try {
    await webhook.send({
      blocks,
    });
  } catch (error) {
    functions.logger.error("error.message", error.message);
    functions.logger.error("error response", error.original.response.data);
    functions.logger.error("error", { error });
    functions.logger.log("blocks", { blocks });
  }
};
