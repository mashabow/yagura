import * as querystring from "querystring";

export interface Condition {
  readonly id: string;
  readonly lastAccess: Date;
  readonly keyword: string;
  readonly category: number; // auccat
}

export const defaultConditions: readonly Condition[] = [
  {
    id: "default0",
    lastAccess: new Date(0),
    keyword: "テスト",
    category: 21700, // 本、雑誌 > コンピュータとインターネット
  },
  {
    id: "default1",
    lastAccess: new Date(0),
    keyword: "サンプル",
    category: 27727, // おもちゃ、ゲーム > ゲーム
  },
];

export const toURL = (condition: Condition): string => {
  const qs = querystring.stringify({
    p: condition.keyword,
    auccat: condition.category,
    va: condition.keyword,
    exflg: 1,
    b: 1,
    n: 100,
    mode: 2,
  });
  return `https://auctions.yahoo.co.jp/search/search?${qs}`;
};
