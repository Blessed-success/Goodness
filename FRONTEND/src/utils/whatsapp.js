/**
 * WhatsApp click-to-chat links require digits-only international format
 * (no leading 0, no '+'). Ghana numbers are commonly entered in local
 * format (0502683544), which wa.me rejects outright — this normalizes
 * either form so links keep working no matter how the number was typed.
 */
export const toWhatsAppNumber = (raw, defaultCountryCode = '233') => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `${defaultCountryCode}${digits.slice(1)}`;
  return digits;
};
