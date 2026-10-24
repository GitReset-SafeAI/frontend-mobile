// Sri Lankan numbers: a nine-digit national number (mobile 7X XXX XXXX, or a landline with its area code),
// written with a leading 0, as +94, or as 0094. Spaces, dashes, dots and brackets are ignored.
// Returns the canonical "+94XXXXXXXXX" form, or null when the input is not a plausible number.
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-.()]/g, '');
  let national: string | undefined;
  if (/^\+94\d{9}$/.test(digits)) national = digits.slice(3);
  else if (/^0094\d{9}$/.test(digits)) national = digits.slice(4);
  else if (/^94\d{9}$/.test(digits)) national = digits.slice(2);
  else if (/^0\d{9}$/.test(digits)) national = digits.slice(1);
  if (!national || national.startsWith('0')) return null;
  return `+94${national}`;
}

// "+94771234567" -> "077 123 4567": how people write and read numbers locally.
export function formatPhone(normalised: string): string {
  const national = normalised.replace(/^\+94/, '');
  if (national.length !== 9) return normalised;
  return `0${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}
