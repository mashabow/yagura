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
import { ProductRepository } from "./repository/productRepository";

const config = functions.config();

const expressReceiver = new ExpressReceiver({
  signingSecret: config.slack.signing_secret,
  endpoints: "/events",
  processBeforeResponse: true,
});

const app = new App({
  receiver: expressReceiver,
  token: config.slack.bot_token,
});

// TODO: なんとかする
let productRepository: ProductRepository;

export const createSlackApp = (productRepo: ProductRepository) => {
  productRepository = productRepo;
  return expressReceiver.app;
};

const ACTION_ID = {
  STAR: "star",
} as const;

app.action<BlockAction<ButtonAction>>(
  ACTION_ID.STAR,
  async ({ action, body, ack, respond }) => {
    await ack();

    let value;
    try {
      value = JSON.parse(action.value);
    } catch {}
    const { conditionId, productId, starred } = value;
    if (
      !(
        typeof conditionId === "string" &&
        typeof productId === "string" &&
        typeof starred === "boolean"
      )
    ) {
      functions.logger.error("Invalid action value", action.value);
      return;
    }
    functions.logger.log("value", { value });

    // リポジトリ内のデータを更新
    const product = await productRepository.get(conditionId, productId);
    if (!product) {
      functions.logger.error("Product not found", { conditionId, productId });
      return;
    }
    const updatedProduct = { ...product, starred };
    productRepository.set(conditionId, updatedProduct);

    // メッセージ更新
    const updatedMessage = buildProductMessage(conditionId, updatedProduct);
    try {
      await respond({
        ...updatedMessage,
        response_type: "in_channel",
        replace_original: true,
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

const buildHeaderMessage = (
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

const buildProductMessage = (
  conditionId: string,
  product: Product
): Message => ({
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
          actionId={ACTION_ID.STAR}
          value={JSON.stringify({
            conditionId: conditionId,
            productId: product.id,
            starred: !product.starred, // 次の状態
          })}
        >
          {product.starred ? "⭐️" : "☆"}
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

const buildFooterMessage = (restCount: number): Message => ({
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
  await post(buildHeaderMessage(condition, products));
  for (const product of products.slice(0, MAX_PRODUCTS)) {
    await post(buildProductMessage(condition.id, product));
  }
  if (products.length > MAX_PRODUCTS) {
    await post(buildFooterMessage(products.length - MAX_PRODUCTS));
  }
};
