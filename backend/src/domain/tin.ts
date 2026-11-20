export function maskTin(tin: string): string {
  const digits = tin.replace(/\D/g, "");
  if (digits.length < 4) return "••••••••";
  return `•••-•••-${digits.slice(-4)}`;
}
