import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { StripePrice } from "#/lib/backend/schema/stripe-prices";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLabel(store: { label: string; value: any }[], value: any, defaultValue?: string) {
  const item = store.find((item) => item.value === value);
  return item ? item.label : defaultValue;
}

export function randomizeArray<T>(array: T[]) {
  const shuffledArray = [...array];
  for (let index = shuffledArray.length - 1; index > 0; index--) {
    const j = Math.floor(Math.random() * (index + 1));
    [shuffledArray[index], shuffledArray[j]] = [shuffledArray[j], shuffledArray[index]];
  }
  return shuffledArray;
}

export function notifyLoading<T>(message: string, action: Promise<T>) {
  const id = toast.loading(message);
  return action.finally(() => {
    toast.dismiss(id);
  });
}

export async function loadingToast(message: string, action: () => Promise<any>) {
  const id = toast.loading(message);
  await action();
  toast.dismiss(id);
}

export function loadingToastFunction(message: string, action: () => Promise<any>) {
  return async () => {
    const id = toast.loading(message);
    await action();
    toast.dismiss(id);
  };
}

export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatPrice(price: StripePrice) {
  const { currency, type } = price;

  switch (type) {
    case "one_time":
      return `${formatAmount(price.unit_amount, currency)}`;

    case "recurring": {
      const interval = price.recurring.interval;
      const count = price.recurring.interval_count ?? 1;
      const shortInterval = count === 1 ? interval : `${count}${interval[0]}`;
      return `${formatAmount(price.unit_amount, currency)}/${shortInterval}`;
    }

    case "tiered": {
      const mode = price.tiers_mode === "volume" ? "vol" : "grad";
      return `From ${formatAmount(price.tiers[0].unit_amount, currency)} (${mode})`;
    }

    default:
      return "Unknown Price";
  }
}

export function formatPriceModel(price: StripePrice) {
  const { type } = price;

  switch (type) {
    case "one_time":
      return "One-Time Payment";

    case "recurring":
      return "Recurring Payment";

    case "tiered":
      return "Tiered Pricing";

    default:
      return "Unknown Model";
  }
}

export function formatDate(date: Date | string | number) {
  if (typeof date === "string") {
    date = new Date(date);
  } else if (typeof date === "number") {
    date = new Date(date * 1000);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | number) {
  if (typeof date === "string") {
    date = new Date(date);
  } else if (typeof date === "number") {
    date = new Date(date * 1000);
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
