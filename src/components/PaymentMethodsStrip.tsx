import Image from "next/image";

/**
 * The accepted-payment strip, as one image rather than nine separate marks.
 * Card-brand artwork is trademarked and each network publishes its own
 * clear-space and minimum-size rules, so a single approved lockup is both
 * safer and one request instead of nine.
 *
 * It renders at its natural 12.5:1 ratio and simply shrinks on narrow screens,
 * which keeps every logo legible down to 320px without a second crop.
 */
export default function PaymentMethodsStrip({
  className = "",
  maxWidth = 420,
}: {
  className?: string;
  maxWidth?: number;
}) {
  return (
    <Image
      src="/images/cards/payment-methods.png"
      alt="Visa, Mastercard, American Express, Apple Pay, Google Pay, BLIK, Revolut Pay, Klarna, Bancontact"
      width={1200}
      height={96}
      sizes="(max-width: 480px) 90vw, 460px"
      className={`h-auto w-full ${className}`}
      style={{ maxWidth }}
    />
  );
}
