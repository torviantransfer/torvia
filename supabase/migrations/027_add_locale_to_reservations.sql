-- =============================================
-- Add locale column to reservations table
-- Needed for: driver WhatsApp notifications in customer's language
-- =============================================

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en';
