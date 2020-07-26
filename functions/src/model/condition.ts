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
