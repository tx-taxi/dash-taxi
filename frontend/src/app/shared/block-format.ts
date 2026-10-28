const DECIMALS = 8, SYMBOL = 'DASH', FEE_UNIT = 'duff/B', FEE_SCALE = 1;
const NUMBER_LOCALE = $localize`:@@tx-taxi.strip.number-locale:en-US`;
const DECIMAL_SEPARATOR = new Intl.NumberFormat(NUMBER_LOCALE, { useGrouping: false }).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';

// Presentation only: never round provider data or detail-page amounts.
export function compactBlockNumber(value: number, amount = false): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.001) return `${value < 0 ? '>−' : '<'}0${DECIMAL_SEPARATOR}001`;
  if (abs >= 1000) {
    const units = ['', 'k', 'M', 'B', 'T'];
    let group = Math.min(4, Math.floor(Math.log10(abs) / 3));
    let scaled = Number((value / 1000 ** group).toPrecision(3));
    if (Math.abs(scaled) >= 1000 && group < 4) { group++; scaled /= 1000; }
    return scaled.toLocaleString(NUMBER_LOCALE, { maximumSignificantDigits: 3, useGrouping: false }) + units[group];
  }
  return value.toLocaleString(NUMBER_LOCALE, amount
    ? { minimumFractionDigits: 2, maximumFractionDigits: 3, useGrouping: false }
    : { maximumSignificantDigits: 3, useGrouping: false });
}

export function compactBlockAmount(value: number | string, atomic = false): string {
  if (value == null) return '—';
  return compactBlockNumber(Number(value) / (atomic ? 1 : 10 ** DECIMALS), !atomic);
}

export function exactBlockAmount(value: number | string): string {
  if (value == null) return '—';
  try {
    const n = BigInt(value), abs = n < 0n ? -n : n, scale = 10n ** BigInt(DECIMALS);
    const fraction = (abs % scale).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
    return (n < 0n ? '-' : '') + (abs / scale).toString() + (fraction ? DECIMAL_SEPARATOR + fraction : '');
  } catch { return '—'; }
}

export function blockValueDetails(total: number | string, median: number, min: number, max: number): string {
  const rate = (value: number) => value == null || !Number.isFinite(value) ? '—' : String(value / FEE_SCALE).replace('.', DECIMAL_SEPARATOR);
  const totalFees = $localize`:@@tx-taxi.strip.total-fees:Total fees`;
  const medianFeeRate = $localize`:@@tx-taxi.strip.median-fee-rate:Median fee rate`;
  const feeRange = $localize`:@@tx-taxi.strip.fee-range:Fee range`;
  return `${totalFees}: ${exactBlockAmount(total)} ${SYMBOL}. ${medianFeeRate}: ${rate(median)} ${FEE_UNIT}. ${feeRange}: ${rate(min)}–${rate(max)} ${FEE_UNIT}.`;
}
