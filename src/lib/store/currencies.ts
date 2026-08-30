import { Currency } from "#/lib/backend/schema";

const currencies = [
  {
    label: "USD",
    value: "usd",
  },
  {
    label: "EUR",
    value: "eur",
  },
  {
    label: "SGD",
    value: "sgd",
  },
  {
    label: "MYR",
    value: "myr",
  },
  {
    label: "CNY",
    value: "cny",
  },
  {
    label: "KRW",
    value: "krw",
  },
  {
    label: "VND",
    value: "vnd",
  },
] satisfies {
  label: string;
  value: Currency;
}[];

export default currencies;
