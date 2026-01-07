-- Add price column to order_items table for extras category items
ALTER TABLE "public"."order_items" ADD COLUMN "price" numeric(10,2);

-- Add comment for documentation
COMMENT ON COLUMN "public"."order_items"."price" IS 'Price for extras category items';
