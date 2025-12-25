-- Add phone_alt column to customers table for secondary phone number
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_alt TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.phone_alt IS 'Secondary phone number for customer';
