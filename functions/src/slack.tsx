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
import { Condition } from "./model/condition";

const url: string | undefined = functions.config().slack?.webhook_url;
if (!url) throw new Error("slack.webhook_url not set");

const webhook = new IncomingWebhook(url);

export const sendProducts = async (
  condition: Condition,
  products: readonly Product[]
): Promise<void> => {
  const blocks = JSXSlack(
    <Blocks>
      <Divider />
      <Section>
        🔍 検索条件 <code>{condition.keyword}</code>
      </Section>
      {products.map((product) => (
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
            🕒{" "}
            <time dateTime={new Date(product.end)}>
              {"{date_pretty} {time}"}
            </time>
          </Field>
          <Image src={product.image} alt="商品画像" />
        </Section>
      ))}
    </Blocks>
  );

  try {
    await webhook.send({
      blocks,
    });
  } catch (e) {
    console.error(e.message);
    console.error(e.response);
    console.log(JSON.stringify(blocks, null, 2));
  }
};
