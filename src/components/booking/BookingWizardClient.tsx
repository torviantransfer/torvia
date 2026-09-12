"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type BookingWizardType from "./BookingWizard";

/**
 * Stands in for the widget while its chunk downloads.
 *
 * The wizard is client-only, so on the booking page — where it is the first
 * thing on a phone and the reason the visit happened at all — the server sends
 * an empty space and the visitor waits for JavaScript. An empty space reads as
 * a page that failed. A card the shape of the form reads as one that is
 * loading, and the difference shows up in whether an ad click stays.
 *
 * Deliberately plain: no text to translate, and roughly the height of the
 * search bar so the arrival of the real form does not shove the page down.
 */
function WidgetSkeleton() {
  return (
    <div
      className="w-full rounded-2xl p-4 sm:p-5"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.07)" }}
      aria-hidden="true"
    >
      <div className="animate-pulse space-y-3">
        <div className="h-11 rounded-xl bg-gray-100" />
        <div className="h-11 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-11 rounded-xl bg-gray-100" />
          <div className="h-11 rounded-xl bg-gray-100" />
        </div>
        <div className="h-11 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

const BookingWizard = dynamic(() => import("./BookingWizard"), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});

export default function BookingWizardClient(props: ComponentProps<typeof BookingWizardType>) {
  return <BookingWizard {...props} />;
}
