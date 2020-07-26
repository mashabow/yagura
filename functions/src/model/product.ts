export interface Product {
  readonly id: string;
  readonly title: string;
  readonly price: number;
  readonly image: string;
  readonly seller: string;
  readonly start: string; // ISOString
  readonly end: string; // ISOString
}
