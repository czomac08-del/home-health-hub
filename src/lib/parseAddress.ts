/** Pulls 2-letter state code from an address string. Returns null if not found. */
const STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]);

export function parseStateFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  // Match a 2-letter state code, optionally followed by a 5-digit ZIP, near the end of the string.
  const match = address.toUpperCase().match(/\b([A-Z]{2})\b(?:[\s,]+\d{5}(?:-\d{4})?)?\s*(?:USA|US)?\s*$/);
  if (match && STATE_CODES.has(match[1])) return match[1];
  // Fallback: any 2-letter token that matches a known state code.
  const tokens = address.toUpperCase().split(/[\s,]+/);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (STATE_CODES.has(tokens[i])) return tokens[i];
  }
  return null;
}
