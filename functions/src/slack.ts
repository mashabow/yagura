import * as functions from "firebase-functions";
import { App, ExpressReceiver, BlockAction, ButtonAction } from "@slack/bolt";
import { Product } from "./model/product";
import { Condition } from "./model/condition";
import { ProductRepository } from "./repository/productRepository";
import {
  Message,
  buildHeaderMessage,
  buildProductMessage,
  buildFooterMessage,
} from "./message";

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

const STAR_ACTION_ID = "star";

app.action<BlockAction<ButtonAction>>(
  STAR_ACTION_ID,
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
    await productRepository.set(conditionId, updatedProduct);

    // メッセージ更新
    const updatedMessage = buildProductMessage(
      conditionId,
      updatedProduct,
      STAR_ACTION_ID
    );
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
    await post(buildProductMessage(condition.id, product, STAR_ACTION_ID));
  }
  if (products.length > MAX_PRODUCTS) {
    await post(buildFooterMessage(products.length - MAX_PRODUCTS));
  }
};
