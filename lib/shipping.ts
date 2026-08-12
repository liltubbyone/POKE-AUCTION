export interface ShippingRate {
  maxOz: number | null // null = catch-all (no upper limit)
  price: number
}

export const DEFAULT_SHIPPING_PRICE = 8

export function parseRates(json: string): ShippingRate[] {
  try {
    const arr = JSON.parse(json)
    if (Array.isArray(arr)) return arr
  } catch {}
  return []
}

export function calcShipping(
  totalWeightOz: number,
  rates: ShippingRate[],
  freeShippingThreshold: number,
  subtotal: number
): { amount: number; isFree: boolean } {
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    return { amount: 0, isFree: true }
  }
  if (rates.length === 0) {
    return { amount: DEFAULT_SHIPPING_PRICE, isFree: false }
  }
  // Find first bracket where totalWeightOz <= maxOz, or maxOz is null (catch-all)
  const bracket = rates.find((r) => r.maxOz === null || totalWeightOz <= r.maxOz)
  const price = bracket?.price ?? rates[rates.length - 1]?.price ?? DEFAULT_SHIPPING_PRICE
  return { amount: price, isFree: false }
}
