import { z } from "zod";

export const reservationSchema = z.object({
  regionSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  categorySlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  tripType: z.enum(["one_way", "round_trip"]).default("one_way"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  returnTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  flightCode: z.string().max(20).optional().nullable(),
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
  hotelName: z.string().max(200).optional().nullable(),
  hotelAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  couponCode: z.string().max(50).optional().nullable(),
  locale: z.enum(["tr", "en", "de", "pl", "ru"]).default("en"),
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
  locale: z.enum(["tr", "en", "de", "pl", "ru"]).default("en"),
});

export const assignDriverSchema = z.object({
  reservationId: z.string().uuid(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  leg: z.enum(["outbound", "return"]).default("outbound"),
  pickupTime: z.string().optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type TrackReservationInput = z.infer<typeof trackReservationSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AssignDriverInput = z.infer<typeof assignDriverSchema>;
