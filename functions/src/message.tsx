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

import { KnownBlock } from "@slack/types";
import { Product } from "./model/product";
import { Condition, toURL } from "./model/condition";

export type Message = {
  text: string;
  blocks?: KnownBlock[];
};

export const buildHeaderMessage = (
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

export const buildProductMessage = (
  conditionId: string,
  product: Product,
  starActionId: string
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
          actionId={starActionId}
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

export const buildFooterMessage = (restCount: number): Message => ({
  text: `ほか${restCount}件`,
});
