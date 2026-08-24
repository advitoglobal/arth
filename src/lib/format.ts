export const locale = "en-GB";

export function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function number(value: number, digits = 0) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function percent(value: number, digits = 0) {
  return `${value > 0 ? "+" : ""}${number(value, digits)}%`;
}
