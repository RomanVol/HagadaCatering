-- Add customer_time and pricing fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_time TIME;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_portions INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS price_per_portion DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN orders.customer_time IS 'Time for customer delivery/pickup';
COMMENT ON COLUMN orders.total_portions IS 'Total number of portions in the order';
COMMENT ON COLUMN orders.price_per_portion IS 'Price per portion in shekels';
COMMENT ON COLUMN orders.delivery_fee IS 'Delivery fee in shekels';
