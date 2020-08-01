/** @jsx JSXSlack.h **/
import {
  JSXSlack,
  Blocks,
  Section,
  Image,
  Field,
  Button,
  Divider,
} from "@speee-js/jsx-slack";

import * as functions from "firebase-functions";
import { App, ExpressReceiver, BlockAction, ButtonAction } from "@slack/bolt";
import { KnownBlock } from "@slack/types";
import { Product } from "./model/product";
import { Condition, toURL } from "./model/condition";

const config = functions.config();

const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.signing_secret,
  endpoints: "/events",
  processBeforeResponse: true,
});

export const slackApp = expressReceiver.app;

const app = new App({
  receiver: expressReceiver,
  token: config.slack.bot_token,
});

const ACTION_ID = {
  LIKE: "like",
  UNLIKE: "unlike",
} as const;

app.action<BlockAction<ButtonAction>>(
  ACTION_ID.LIKE,
  async ({ action, body, ack, respond }) => {
    await ack();

    let value;
    try {
      value = JSON.parse(action.value);
    } catch {}
    const { conditionId, productId } = value;
    if (!conditionId || !productId) {
      functions.logger.error("Failed to parse action value", action.value);
      return;
    }
    functions.logger.log("value", { value });

    // blocks の内容を更新する
    if (!body.message) {
      functions.logger.error("Message not found", body);
      return;
    }
    const blocks = (body.message.blocks as KnownBlock[]).map((block) => {
      if (block.block_id === action.block_id) {
        return {
          ...block,
          block_id: undefined,
          accessory: (
            <Button actionId={ACTION_ID.UNLIKE} value={action.value}>
              ⭐️
            </Button>
          ),
        };
      }
      if ("accessory" in block && block.accessory?.type === "image") {
        const { alt_text, image_url } = block.accessory as any;
        return {
          ...block,
          block_id: undefined,
          // accessory に不要なプロパティがあると 404 が返ってくるので注意
          accessory: { type: "image", alt_text, image_url },
        };
      }
      return {
        ...block,
        block_id: undefined,
      };
    });

    try {
      await respond({
        response_type: "in_channel",
        replace_original: true,
        text: body.message?.text,
        blocks,
      });
    } catch (error) {
      functions.logger.error("error", { error });
    }
  }
);

type Message = {
  text: string;
  blocks?: KnownBlock[];
};

const buildHeader = (
  condition: Condition,
  products: readonly Product[]
): Message => ({
  text: `[${condition.keyword}] の新着：${products.length}件`,
  blocks: JSXSlack(
    <Blocks>
      <Section>
        🔍 検索条件{" "}
        <a href={toURL(condition)}>
          <code>{condition.keyword}</code>
        </a>{" "}
        の新着：{products.length}件
      </Section>
    </Blocks>
  ),
});

const buildProduct = (condition: Condition, product: Product): Message => ({
  text: product.title,
  blocks: JSXSlack(
    <Blocks>
      <Section>
        <strong>
          <a
            href={`https://page.auctions.yahoo.co.jp/jp/auction/${product.id}`}
          >
            {product.title}
          </a>
        </strong>
        <Button
          actionId={ACTION_ID.LIKE}
          value={JSON.stringify({
            conditionId: condition.id,
            productId: product.id,
          })}
        >
          ☆
        </Button>
      </Section>
      <Section>
        <Field>💰 {product.price.toLocaleString()}円</Field>
        <Field>👤 {product.seller}</Field>
        <Field>
          🕒 <time dateTime={product.end}>{"{date_pretty} {time}"}</time>
        </Field>
        <Image src={product.image} alt="商品画像" />
      </Section>
      <Divider />
    </Blocks>
  ),
});

const buildFooter = (restCount: number): Message => ({
  text: `ほか${restCount}件`,
});

const post = async ({ text, blocks }: Message): Promise<void> => {
  try {
    await app.client.chat.postMessage({
      token: config.slack.bot_token,
      channel: "C018EDJ858Q", // TODO: 自動で設定
      text,
      blocks,
    });
  } catch (error) {
    functions.logger.error("error", { error });
    functions.logger.log("blocks", { blocks });
  }
};

const MAX_PRODUCTS = 20;

export const postProducts = async (
  condition: Condition,
  products: readonly Product[]
): Promise<void> => {
  await post(buildHeader(condition, products));
  for (const product of products.slice(0, MAX_PRODUCTS)) {
    await post(buildProduct(condition, product));
  }
  if (products.length > MAX_PRODUCTS) {
    await post(buildFooter(products.length - MAX_PRODUCTS));
  }
};
