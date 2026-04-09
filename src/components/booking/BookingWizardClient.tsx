"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type BookingWizardType from "./BookingWizard";

const BookingWizard = dynamic(() => import("./BookingWizard"), { ssr: false });

export default function BookingWizardClient(props: ComponentProps<typeof BookingWizardType>) {
  return <BookingWizard {...props} />;
}
