export interface Condition {
  readonly keyword: string;
  readonly category: number; // auccat
}

export const defaultConditions: readonly Condition[] = [
  {
    keyword: "テスト",
    category: 21700, // 本、雑誌 > コンピュータとインターネット
  },
  {
    keyword: "サンプル",
    category: 27727, // おもちゃ、ゲーム > ゲーム
  },
];
