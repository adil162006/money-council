export function formatIndianCommas(num: number): string {
  const numStr = Math.round(num).toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherDigits = numStr.substring(0, numStr.length - 3);
  if (otherDigits !== '') {
    return otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  return lastThree;
}

/**
 * Formats a number with Indian currency symbol (₹) and comma spacing.
 * If compact is true:
 * - > 1 Crore (1,00,00,000) -> 1.2Cr
 * - > 1 Lakh (1,00,000) -> 1.2L
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  if (compact) {
    if (absAmount >= 10000000) { // 1 Crore
      const crVal = absAmount / 10000000;
      return `${isNegative ? '-' : ''}₹${crVal % 1 === 0 ? crVal.toFixed(0) : crVal.toFixed(1)}Cr`;
    }
    if (absAmount >= 100000) { // 1 Lakh
      const lakhVal = absAmount / 100000;
      return `${isNegative ? '-' : ''}₹${lakhVal % 1 === 0 ? lakhVal.toFixed(0) : lakhVal.toFixed(1)}L`;
    }
  }

  return `${isNegative ? '-' : ''}₹${formatIndianCommas(absAmount)}`;
}
