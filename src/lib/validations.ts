import { z } from "zod";

export const reservationSchema = z.object({
  regionSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  categorySlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
  /* Which way the outbound leg runs. The column and every screen that prints a
     route have understood this since migration 060, but the booking form never
     sent it, so a customer who asked to be taken from their hotel to the
     airport was booked, vouchered and driven the other way. */
  direction: z.enum(["airport_to_region", "region_to_airport"]).default("airport_to_region"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  /* Both were required. The driver does need somewhere to take the customer and
     the flight number is what tells the office a 3am arrival is running late
     rather than a no-show — but demanding them at checkout asks for answers the
     customer often does not have yet. The flight is usually booked after the
     transfer is priced, and the hotel can still be undecided. Requiring them
     bought clean records at the price of the booking itself.
     Empty strings are normalised to null so a blank field is stored as "not
     given" rather than as "". */
  flightCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  returnFlightCode: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  adults: z.number().int().min(1).max(20).default(1),
  children: z.number().int().min(0).max(10).default(0),
  luggage: z.number().int().min(0).max(20).default(0),
  childSeat: z.boolean().default(false),
  welcomeSign: z.boolean().default(false),
  welcomeName: z.string().max(100).optional().nullable(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(255),
  phone: z.string().trim().min(7).max(20).regex(/^[+]?[0-9\s()-]+$/, "Invalid phone number"),
  hotelName: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  hotelAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  couponCode: z.string().max(50).optional().nullable(),
  locale: z.enum(["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"]).default("en"),
  paymentMethod: z.enum(["online", "cash"]).default("online").optional(),
}).refine(
  (data) => {
    // Parse as Turkey time (UTC+3) since all transfers are Antalya-based
    const pickup = new Date(`${data.pickupDate}T${data.pickupTime}:00+03:00`);
    const now = new Date();
    now.setTime(now.getTime() - 60 * 60 * 1000); // 1h grace
    return pickup > now;
  },
  { message: "Pickup date must be in the future", path: ["pickupDate"] }
).refine(
  (data) => {
    if (data.tripType === "round_trip") {
      return !!data.returnDate && !!data.returnTime;
    }
    return true;
  },
  { message: "Return date/time required for round trip", path: ["returnDate"] }
);

export const trackReservationSchema = z.object({
  code: z.string().min(1).max(20).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(255).trim().toLowerCase(),
  subject: z.string().min(1).max(200).trim(),
  message: z.string().min(1).max(5000).trim(),
  locale: z.enum(["tr", "en", "de", "pl", "ru", "nl", "ro", "ar"]).default("en"),
});

export const assignDriverSchema = z.object({
  reservationId: z.string().uuid(),
  // Accept common UUID-like strings used by the frontend (36 chars hex + dashes)
  // This is a pragmatic relaxation to allow non-standard seeded IDs; prefer
  // fixing the source data long-term.
  driverId: z.string().regex(/^[0-9a-fA-F-]{36}$/, "Invalid UUID-like driverId"),
  vehicleId: z.string().regex(/^[0-9a-fA-F-]{36}$/, "Invalid UUID-like vehicleId"),
  leg: z.enum(["outbound", "return"]).default("outbound"),
  pickupTime: z.string().optional(),
  // What we pay this driver for this leg. Optional because the rate is often
  // agreed after the driver is booked; null and absent both mean "not yet".
  driverFee: z.coerce.number().min(0).nullable().optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type TrackReservationInput = z.infer<typeof trackReservationSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
