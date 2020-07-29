/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Blocks,
  Section,
  Image,
  Field,
  Divider,
  Button,
  Fragment,
  Actions,
} from "@speee-js/jsx-slack";

import * as functions from "firebase-functions";
import { App, ExpressReceiver } from "@slack/bolt";
import { Product } from "./model/product";
import { Condition, toURL } from "./model/condition";

const config = functions.config();

const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.signing_secret,
  endpoints: "/events",
  processBeforeResponse: true,
});

const app = new App({
  receiver: expressReceiver,
  token: config.slack.bot_token,
  processBeforeResponse: true,
});

export const slackApp = expressReceiver.app;

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
        </a>{" "}
        の新着：{products.length}件
      </Section>
      {products.slice(0, MAX_PRODUCTS).map((product) => (
        <Fragment>
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
          <Actions>
            <Button
              actionId="like"
              value={JSON.stringify({
                conditionId: condition.id,
                productId: product.id,
              })}
            >
              気になる
            </Button>
          </Actions>
        </Fragment>
      ))}
      {products.length > MAX_PRODUCTS && (
        <Section>ほか{products.length - MAX_PRODUCTS}件</Section>
      )}
      <Divider />
    </Blocks>
  );

  try {
    await app.client.chat.postMessage({
      token: config.slack.bot_token,
      channel: "C018EDJ858Q", // TODO: 自動で設定
      text: `[${condition.keyword}] の新着：${products.length}件`,
      blocks,
    });
  } catch (error) {
    functions.logger.error("error", { error });
    functions.logger.log("blocks", { blocks });
  }
};
