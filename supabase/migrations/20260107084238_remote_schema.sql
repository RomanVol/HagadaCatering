drop extension if exists "pg_net";

create type "public"."measurement_type" as enum ('liters', 'size', 'none');

create sequence "public"."orders_order_number_seq";


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "name_en" text not null,
    "max_selection" integer,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."categories" enable row level security;


  create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "phone" text not null,
    "name" text,
    "address" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "phone_alt" text
      );


alter table "public"."customers" enable row level security;


  create table "public"."extra_order_item_variations" (
    "id" uuid not null default gen_random_uuid(),
    "extra_order_item_id" uuid not null,
    "variation_id" uuid not null,
    "name" text not null,
    "size_big" integer default 0,
    "size_small" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."extra_order_item_variations" enable row level security;


  create table "public"."extra_order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "source_food_item_id" uuid not null,
    "source_category" text not null,
    "name" text not null,
    "quantity" integer default 0,
    "size_big" integer default 0,
    "size_small" integer default 0,
    "price" numeric(10,2) not null default 0,
    "note" text,
    "preparation_name" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."extra_order_items" enable row level security;


  create table "public"."food_item_add_ons" (
    "id" uuid not null default gen_random_uuid(),
    "parent_food_item_id" uuid not null,
    "name" text not null,
    "measurement_type" text not null default 'liters'::text,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "linked_food_item_id" uuid
      );


alter table "public"."food_item_add_ons" enable row level security;


  create table "public"."food_item_custom_liters" (
    "id" uuid not null default gen_random_uuid(),
    "food_item_id" uuid not null,
    "size" numeric(3,1) not null,
    "label" text not null,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_item_custom_liters" enable row level security;


  create table "public"."food_item_preparations" (
    "id" uuid not null default gen_random_uuid(),
    "parent_food_item_id" uuid not null,
    "name" text not null,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_item_preparations" enable row level security;


  create table "public"."food_item_variations" (
    "id" uuid not null default gen_random_uuid(),
    "parent_food_item_id" uuid not null,
    "name" text not null,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."food_item_variations" enable row level security;


  create table "public"."food_items" (
    "id" uuid not null default gen_random_uuid(),
    "category_id" uuid not null,
    "name" text not null,
    "has_liters" boolean not null default false,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "measurement_type" text default 'none'::text,
    "portion_multiplier" numeric(10,2) default NULL::numeric,
    "portion_unit" text
      );


alter table "public"."food_items" enable row level security;


  create table "public"."liter_sizes" (
    "id" uuid not null default gen_random_uuid(),
    "size" numeric(3,1) not null,
    "label" text not null,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."liter_sizes" enable row level security;


  create table "public"."order_items" (
    "id" uuid not null default gen_random_uuid(),
    "order_id" uuid not null,
    "food_item_id" uuid not null,
    "liter_size_id" uuid,
    "quantity" integer not null default 1,
    "created_at" timestamp with time zone not null default now(),
    "size_type" text,
    "preparation_id" uuid,
    "add_on_id" uuid,
    "parent_order_item_id" uuid,
    "variation_id" uuid,
    "item_note" text
      );


alter table "public"."order_items" enable row level security;


  create table "public"."orders" (
    "id" uuid not null default gen_random_uuid(),
    "order_number" integer not null default nextval('public.orders_order_number_seq'::regclass),
    "customer_id" uuid,
    "order_date" date not null,
    "order_time" time without time zone,
    "delivery_address" text,
    "notes" text,
    "status" text not null default 'draft'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "customer_time" time without time zone,
    "total_portions" integer,
    "price_per_portion" numeric(10,2),
    "delivery_fee" numeric(10,2)
      );


alter table "public"."orders" enable row level security;

alter sequence "public"."orders_order_number_seq" owned by "public"."orders"."order_number";

CREATE UNIQUE INDEX categories_name_en_unique ON public.categories USING btree (name_en);

CREATE UNIQUE INDEX categories_name_unique ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX customers_phone_unique ON public.customers USING btree (phone);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX extra_order_item_variations_pkey ON public.extra_order_item_variations USING btree (id);

CREATE UNIQUE INDEX extra_order_items_pkey ON public.extra_order_items USING btree (id);

CREATE UNIQUE INDEX food_item_add_ons_pkey ON public.food_item_add_ons USING btree (id);

CREATE UNIQUE INDEX food_item_custom_liters_pkey ON public.food_item_custom_liters USING btree (id);

CREATE UNIQUE INDEX food_item_custom_liters_unique ON public.food_item_custom_liters USING btree (food_item_id, size);

CREATE UNIQUE INDEX food_item_preparations_pkey ON public.food_item_preparations USING btree (id);

CREATE UNIQUE INDEX food_item_variations_pkey ON public.food_item_variations USING btree (id);

CREATE UNIQUE INDEX food_items_name_category_unique ON public.food_items USING btree (name, category_id);

CREATE UNIQUE INDEX food_items_pkey ON public.food_items USING btree (id);

CREATE INDEX idx_add_ons_parent ON public.food_item_add_ons USING btree (parent_food_item_id);

CREATE INDEX idx_categories_sort ON public.categories USING btree (sort_order);

CREATE INDEX idx_customers_name ON public.customers USING btree (name);

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);

CREATE INDEX idx_food_item_add_ons_linked ON public.food_item_add_ons USING btree (linked_food_item_id);

CREATE INDEX idx_food_item_custom_liters_food_item ON public.food_item_custom_liters USING btree (food_item_id);

CREATE INDEX idx_food_item_custom_liters_sort ON public.food_item_custom_liters USING btree (sort_order);

CREATE INDEX idx_food_items_active ON public.food_items USING btree (is_active);

CREATE INDEX idx_food_items_category ON public.food_items USING btree (category_id);

CREATE INDEX idx_food_items_sort ON public.food_items USING btree (category_id, sort_order);

CREATE INDEX idx_liter_sizes_sort ON public.liter_sizes USING btree (sort_order);

CREATE INDEX idx_order_items_food ON public.order_items USING btree (food_item_id);

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_id);

CREATE INDEX idx_orders_date ON public.orders USING btree (order_date);

CREATE INDEX idx_orders_status ON public.orders USING btree (status);

CREATE INDEX idx_orders_updated ON public.orders USING btree (updated_at);

CREATE INDEX idx_preparations_parent_food_item ON public.food_item_preparations USING btree (parent_food_item_id);

CREATE INDEX idx_variations_parent_food_item ON public.food_item_variations USING btree (parent_food_item_id);

CREATE UNIQUE INDEX liter_sizes_pkey ON public.liter_sizes USING btree (id);

CREATE UNIQUE INDEX liter_sizes_size_unique ON public.liter_sizes USING btree (size);

CREATE UNIQUE INDEX order_items_pkey ON public.order_items USING btree (id);

CREATE UNIQUE INDEX order_items_unique_combo ON public.order_items USING btree (order_id, food_item_id, liter_size_id, size_type, add_on_id, variation_id);

CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id);

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."extra_order_item_variations" add constraint "extra_order_item_variations_pkey" PRIMARY KEY using index "extra_order_item_variations_pkey";

alter table "public"."extra_order_items" add constraint "extra_order_items_pkey" PRIMARY KEY using index "extra_order_items_pkey";

alter table "public"."food_item_add_ons" add constraint "food_item_add_ons_pkey" PRIMARY KEY using index "food_item_add_ons_pkey";

alter table "public"."food_item_custom_liters" add constraint "food_item_custom_liters_pkey" PRIMARY KEY using index "food_item_custom_liters_pkey";

alter table "public"."food_item_preparations" add constraint "food_item_preparations_pkey" PRIMARY KEY using index "food_item_preparations_pkey";

alter table "public"."food_item_variations" add constraint "food_item_variations_pkey" PRIMARY KEY using index "food_item_variations_pkey";

alter table "public"."food_items" add constraint "food_items_pkey" PRIMARY KEY using index "food_items_pkey";

alter table "public"."liter_sizes" add constraint "liter_sizes_pkey" PRIMARY KEY using index "liter_sizes_pkey";

alter table "public"."order_items" add constraint "order_items_pkey" PRIMARY KEY using index "order_items_pkey";

alter table "public"."orders" add constraint "orders_pkey" PRIMARY KEY using index "orders_pkey";

alter table "public"."categories" add constraint "categories_name_en_unique" UNIQUE using index "categories_name_en_unique";

alter table "public"."categories" add constraint "categories_name_unique" UNIQUE using index "categories_name_unique";

alter table "public"."customers" add constraint "customers_phone_unique" UNIQUE using index "customers_phone_unique";

alter table "public"."extra_order_item_variations" add constraint "extra_order_item_variations_extra_order_item_id_fkey" FOREIGN KEY (extra_order_item_id) REFERENCES public.extra_order_items(id) ON DELETE CASCADE not valid;

alter table "public"."extra_order_item_variations" validate constraint "extra_order_item_variations_extra_order_item_id_fkey";

alter table "public"."extra_order_items" add constraint "extra_order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."extra_order_items" validate constraint "extra_order_items_order_id_fkey";

alter table "public"."extra_order_items" add constraint "extra_order_items_source_food_item_id_fkey" FOREIGN KEY (source_food_item_id) REFERENCES public.food_items(id) not valid;

alter table "public"."extra_order_items" validate constraint "extra_order_items_source_food_item_id_fkey";

alter table "public"."food_item_add_ons" add constraint "food_item_add_ons_linked_food_item_id_fkey" FOREIGN KEY (linked_food_item_id) REFERENCES public.food_items(id) ON DELETE SET NULL not valid;

alter table "public"."food_item_add_ons" validate constraint "food_item_add_ons_linked_food_item_id_fkey";

alter table "public"."food_item_add_ons" add constraint "food_item_add_ons_measurement_type_check" CHECK ((measurement_type = ANY (ARRAY['liters'::text, 'size'::text, 'none'::text]))) not valid;

alter table "public"."food_item_add_ons" validate constraint "food_item_add_ons_measurement_type_check";

alter table "public"."food_item_add_ons" add constraint "food_item_add_ons_parent_food_item_id_fkey" FOREIGN KEY (parent_food_item_id) REFERENCES public.food_items(id) ON DELETE CASCADE not valid;

alter table "public"."food_item_add_ons" validate constraint "food_item_add_ons_parent_food_item_id_fkey";

alter table "public"."food_item_custom_liters" add constraint "food_item_custom_liters_food_item_id_fkey" FOREIGN KEY (food_item_id) REFERENCES public.food_items(id) ON DELETE CASCADE not valid;

alter table "public"."food_item_custom_liters" validate constraint "food_item_custom_liters_food_item_id_fkey";

alter table "public"."food_item_custom_liters" add constraint "food_item_custom_liters_unique" UNIQUE using index "food_item_custom_liters_unique";

alter table "public"."food_item_preparations" add constraint "food_item_preparations_parent_food_item_id_fkey" FOREIGN KEY (parent_food_item_id) REFERENCES public.food_items(id) ON DELETE CASCADE not valid;

alter table "public"."food_item_preparations" validate constraint "food_item_preparations_parent_food_item_id_fkey";

alter table "public"."food_item_variations" add constraint "food_item_variations_parent_food_item_id_fkey" FOREIGN KEY (parent_food_item_id) REFERENCES public.food_items(id) ON DELETE CASCADE not valid;

alter table "public"."food_item_variations" validate constraint "food_item_variations_parent_food_item_id_fkey";

alter table "public"."food_items" add constraint "food_items_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT not valid;

alter table "public"."food_items" validate constraint "food_items_category_id_fkey";

alter table "public"."food_items" add constraint "food_items_name_category_unique" UNIQUE using index "food_items_name_category_unique";

alter table "public"."liter_sizes" add constraint "liter_sizes_size_unique" UNIQUE using index "liter_sizes_size_unique";

alter table "public"."order_items" add constraint "order_items_add_on_id_fkey" FOREIGN KEY (add_on_id) REFERENCES public.food_item_add_ons(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_add_on_id_fkey";

alter table "public"."order_items" add constraint "order_items_food_item_id_fkey" FOREIGN KEY (food_item_id) REFERENCES public.food_items(id) ON DELETE RESTRICT not valid;

alter table "public"."order_items" validate constraint "order_items_food_item_id_fkey";

alter table "public"."order_items" add constraint "order_items_liter_size_id_fkey" FOREIGN KEY (liter_size_id) REFERENCES public.liter_sizes(id) ON DELETE RESTRICT not valid;

alter table "public"."order_items" validate constraint "order_items_liter_size_id_fkey";

alter table "public"."order_items" add constraint "order_items_measurement_check" CHECK ((NOT ((liter_size_id IS NOT NULL) AND (size_type IS NOT NULL)))) not valid;

alter table "public"."order_items" validate constraint "order_items_measurement_check";

alter table "public"."order_items" add constraint "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_order_id_fkey";

alter table "public"."order_items" add constraint "order_items_parent_order_item_id_fkey" FOREIGN KEY (parent_order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE not valid;

alter table "public"."order_items" validate constraint "order_items_parent_order_item_id_fkey";

alter table "public"."order_items" add constraint "order_items_preparation_id_fkey" FOREIGN KEY (preparation_id) REFERENCES public.food_item_preparations(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_preparation_id_fkey";

alter table "public"."order_items" add constraint "order_items_quantity_positive" CHECK ((quantity > 0)) not valid;

alter table "public"."order_items" validate constraint "order_items_quantity_positive";

alter table "public"."order_items" add constraint "order_items_size_type_check" CHECK (((size_type = ANY (ARRAY['big'::text, 'small'::text])) OR (size_type IS NULL))) not valid;

alter table "public"."order_items" validate constraint "order_items_size_type_check";

alter table "public"."order_items" add constraint "order_items_unique_combo" UNIQUE using index "order_items_unique_combo";

alter table "public"."order_items" add constraint "order_items_variation_id_fkey" FOREIGN KEY (variation_id) REFERENCES public.food_item_variations(id) ON DELETE SET NULL not valid;

alter table "public"."order_items" validate constraint "order_items_variation_id_fkey";

alter table "public"."orders" add constraint "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."orders" validate constraint "orders_customer_id_fkey";

alter table "public"."orders" add constraint "orders_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."orders" validate constraint "orders_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."extra_order_item_variations" to "anon";

grant insert on table "public"."extra_order_item_variations" to "anon";

grant references on table "public"."extra_order_item_variations" to "anon";

grant select on table "public"."extra_order_item_variations" to "anon";

grant trigger on table "public"."extra_order_item_variations" to "anon";

grant truncate on table "public"."extra_order_item_variations" to "anon";

grant update on table "public"."extra_order_item_variations" to "anon";

grant delete on table "public"."extra_order_item_variations" to "authenticated";

grant insert on table "public"."extra_order_item_variations" to "authenticated";

grant references on table "public"."extra_order_item_variations" to "authenticated";

grant select on table "public"."extra_order_item_variations" to "authenticated";

grant trigger on table "public"."extra_order_item_variations" to "authenticated";

grant truncate on table "public"."extra_order_item_variations" to "authenticated";

grant update on table "public"."extra_order_item_variations" to "authenticated";

grant delete on table "public"."extra_order_item_variations" to "service_role";

grant insert on table "public"."extra_order_item_variations" to "service_role";

grant references on table "public"."extra_order_item_variations" to "service_role";

grant select on table "public"."extra_order_item_variations" to "service_role";

grant trigger on table "public"."extra_order_item_variations" to "service_role";

grant truncate on table "public"."extra_order_item_variations" to "service_role";

grant update on table "public"."extra_order_item_variations" to "service_role";

grant delete on table "public"."extra_order_items" to "anon";

grant insert on table "public"."extra_order_items" to "anon";

grant references on table "public"."extra_order_items" to "anon";

grant select on table "public"."extra_order_items" to "anon";

grant trigger on table "public"."extra_order_items" to "anon";

grant truncate on table "public"."extra_order_items" to "anon";

grant update on table "public"."extra_order_items" to "anon";

grant delete on table "public"."extra_order_items" to "authenticated";

grant insert on table "public"."extra_order_items" to "authenticated";

grant references on table "public"."extra_order_items" to "authenticated";

grant select on table "public"."extra_order_items" to "authenticated";

grant trigger on table "public"."extra_order_items" to "authenticated";

grant truncate on table "public"."extra_order_items" to "authenticated";

grant update on table "public"."extra_order_items" to "authenticated";

grant delete on table "public"."extra_order_items" to "service_role";

grant insert on table "public"."extra_order_items" to "service_role";

grant references on table "public"."extra_order_items" to "service_role";

grant select on table "public"."extra_order_items" to "service_role";

grant trigger on table "public"."extra_order_items" to "service_role";

grant truncate on table "public"."extra_order_items" to "service_role";

grant update on table "public"."extra_order_items" to "service_role";

grant delete on table "public"."food_item_add_ons" to "anon";

grant insert on table "public"."food_item_add_ons" to "anon";

grant references on table "public"."food_item_add_ons" to "anon";

grant select on table "public"."food_item_add_ons" to "anon";

grant trigger on table "public"."food_item_add_ons" to "anon";

grant truncate on table "public"."food_item_add_ons" to "anon";

grant update on table "public"."food_item_add_ons" to "anon";

grant delete on table "public"."food_item_add_ons" to "authenticated";

grant insert on table "public"."food_item_add_ons" to "authenticated";

grant references on table "public"."food_item_add_ons" to "authenticated";

grant select on table "public"."food_item_add_ons" to "authenticated";

grant trigger on table "public"."food_item_add_ons" to "authenticated";

grant truncate on table "public"."food_item_add_ons" to "authenticated";

grant update on table "public"."food_item_add_ons" to "authenticated";

grant delete on table "public"."food_item_add_ons" to "service_role";

grant insert on table "public"."food_item_add_ons" to "service_role";

grant references on table "public"."food_item_add_ons" to "service_role";

grant select on table "public"."food_item_add_ons" to "service_role";

grant trigger on table "public"."food_item_add_ons" to "service_role";

grant truncate on table "public"."food_item_add_ons" to "service_role";

grant update on table "public"."food_item_add_ons" to "service_role";

grant delete on table "public"."food_item_custom_liters" to "anon";

grant insert on table "public"."food_item_custom_liters" to "anon";

grant references on table "public"."food_item_custom_liters" to "anon";

grant select on table "public"."food_item_custom_liters" to "anon";

grant trigger on table "public"."food_item_custom_liters" to "anon";

grant truncate on table "public"."food_item_custom_liters" to "anon";

grant update on table "public"."food_item_custom_liters" to "anon";

grant delete on table "public"."food_item_custom_liters" to "authenticated";

grant insert on table "public"."food_item_custom_liters" to "authenticated";

grant references on table "public"."food_item_custom_liters" to "authenticated";

grant select on table "public"."food_item_custom_liters" to "authenticated";

grant trigger on table "public"."food_item_custom_liters" to "authenticated";

grant truncate on table "public"."food_item_custom_liters" to "authenticated";

grant update on table "public"."food_item_custom_liters" to "authenticated";

grant delete on table "public"."food_item_custom_liters" to "service_role";

grant insert on table "public"."food_item_custom_liters" to "service_role";

grant references on table "public"."food_item_custom_liters" to "service_role";

grant select on table "public"."food_item_custom_liters" to "service_role";

grant trigger on table "public"."food_item_custom_liters" to "service_role";

grant truncate on table "public"."food_item_custom_liters" to "service_role";

grant update on table "public"."food_item_custom_liters" to "service_role";

grant delete on table "public"."food_item_preparations" to "anon";

grant insert on table "public"."food_item_preparations" to "anon";

grant references on table "public"."food_item_preparations" to "anon";

grant select on table "public"."food_item_preparations" to "anon";

grant trigger on table "public"."food_item_preparations" to "anon";

grant truncate on table "public"."food_item_preparations" to "anon";

grant update on table "public"."food_item_preparations" to "anon";

grant delete on table "public"."food_item_preparations" to "authenticated";

grant insert on table "public"."food_item_preparations" to "authenticated";

grant references on table "public"."food_item_preparations" to "authenticated";

grant select on table "public"."food_item_preparations" to "authenticated";

grant trigger on table "public"."food_item_preparations" to "authenticated";

grant truncate on table "public"."food_item_preparations" to "authenticated";

grant update on table "public"."food_item_preparations" to "authenticated";

grant delete on table "public"."food_item_preparations" to "service_role";

grant insert on table "public"."food_item_preparations" to "service_role";

grant references on table "public"."food_item_preparations" to "service_role";

grant select on table "public"."food_item_preparations" to "service_role";

grant trigger on table "public"."food_item_preparations" to "service_role";

grant truncate on table "public"."food_item_preparations" to "service_role";

grant update on table "public"."food_item_preparations" to "service_role";

grant delete on table "public"."food_item_variations" to "anon";

grant insert on table "public"."food_item_variations" to "anon";

grant references on table "public"."food_item_variations" to "anon";

grant select on table "public"."food_item_variations" to "anon";

grant trigger on table "public"."food_item_variations" to "anon";

grant truncate on table "public"."food_item_variations" to "anon";

grant update on table "public"."food_item_variations" to "anon";

grant delete on table "public"."food_item_variations" to "authenticated";

grant insert on table "public"."food_item_variations" to "authenticated";

grant references on table "public"."food_item_variations" to "authenticated";

grant select on table "public"."food_item_variations" to "authenticated";

grant trigger on table "public"."food_item_variations" to "authenticated";

grant truncate on table "public"."food_item_variations" to "authenticated";

grant update on table "public"."food_item_variations" to "authenticated";

grant delete on table "public"."food_item_variations" to "service_role";

grant insert on table "public"."food_item_variations" to "service_role";

grant references on table "public"."food_item_variations" to "service_role";

grant select on table "public"."food_item_variations" to "service_role";

grant trigger on table "public"."food_item_variations" to "service_role";

grant truncate on table "public"."food_item_variations" to "service_role";

grant update on table "public"."food_item_variations" to "service_role";

grant delete on table "public"."food_items" to "anon";

grant insert on table "public"."food_items" to "anon";

grant references on table "public"."food_items" to "anon";

grant select on table "public"."food_items" to "anon";

grant trigger on table "public"."food_items" to "anon";

grant truncate on table "public"."food_items" to "anon";

grant update on table "public"."food_items" to "anon";

grant delete on table "public"."food_items" to "authenticated";

grant insert on table "public"."food_items" to "authenticated";

grant references on table "public"."food_items" to "authenticated";

grant select on table "public"."food_items" to "authenticated";

grant trigger on table "public"."food_items" to "authenticated";

grant truncate on table "public"."food_items" to "authenticated";

grant update on table "public"."food_items" to "authenticated";

grant delete on table "public"."food_items" to "service_role";

grant insert on table "public"."food_items" to "service_role";

grant references on table "public"."food_items" to "service_role";

grant select on table "public"."food_items" to "service_role";

grant trigger on table "public"."food_items" to "service_role";

grant truncate on table "public"."food_items" to "service_role";

grant update on table "public"."food_items" to "service_role";

grant delete on table "public"."liter_sizes" to "anon";

grant insert on table "public"."liter_sizes" to "anon";

grant references on table "public"."liter_sizes" to "anon";

grant select on table "public"."liter_sizes" to "anon";

grant trigger on table "public"."liter_sizes" to "anon";

grant truncate on table "public"."liter_sizes" to "anon";

grant update on table "public"."liter_sizes" to "anon";

grant delete on table "public"."liter_sizes" to "authenticated";

grant insert on table "public"."liter_sizes" to "authenticated";

grant references on table "public"."liter_sizes" to "authenticated";

grant select on table "public"."liter_sizes" to "authenticated";

grant trigger on table "public"."liter_sizes" to "authenticated";

grant truncate on table "public"."liter_sizes" to "authenticated";

grant update on table "public"."liter_sizes" to "authenticated";

grant delete on table "public"."liter_sizes" to "service_role";

grant insert on table "public"."liter_sizes" to "service_role";

grant references on table "public"."liter_sizes" to "service_role";

grant select on table "public"."liter_sizes" to "service_role";

grant trigger on table "public"."liter_sizes" to "service_role";

grant truncate on table "public"."liter_sizes" to "service_role";

grant update on table "public"."liter_sizes" to "service_role";

grant delete on table "public"."order_items" to "anon";

grant insert on table "public"."order_items" to "anon";

grant references on table "public"."order_items" to "anon";

grant select on table "public"."order_items" to "anon";

grant trigger on table "public"."order_items" to "anon";

grant truncate on table "public"."order_items" to "anon";

grant update on table "public"."order_items" to "anon";

grant delete on table "public"."order_items" to "authenticated";

grant insert on table "public"."order_items" to "authenticated";

grant references on table "public"."order_items" to "authenticated";

grant select on table "public"."order_items" to "authenticated";

grant trigger on table "public"."order_items" to "authenticated";

grant truncate on table "public"."order_items" to "authenticated";

grant update on table "public"."order_items" to "authenticated";

grant delete on table "public"."order_items" to "service_role";

grant insert on table "public"."order_items" to "service_role";

grant references on table "public"."order_items" to "service_role";

grant select on table "public"."order_items" to "service_role";

grant trigger on table "public"."order_items" to "service_role";

grant truncate on table "public"."order_items" to "service_role";

grant update on table "public"."order_items" to "service_role";

grant delete on table "public"."orders" to "anon";

grant insert on table "public"."orders" to "anon";

grant references on table "public"."orders" to "anon";

grant select on table "public"."orders" to "anon";

grant trigger on table "public"."orders" to "anon";

grant truncate on table "public"."orders" to "anon";

grant update on table "public"."orders" to "anon";

grant delete on table "public"."orders" to "authenticated";

grant insert on table "public"."orders" to "authenticated";

grant references on table "public"."orders" to "authenticated";

grant select on table "public"."orders" to "authenticated";

grant trigger on table "public"."orders" to "authenticated";

grant truncate on table "public"."orders" to "authenticated";

grant update on table "public"."orders" to "authenticated";

grant delete on table "public"."orders" to "service_role";

grant insert on table "public"."orders" to "service_role";

grant references on table "public"."orders" to "service_role";

grant select on table "public"."orders" to "service_role";

grant trigger on table "public"."orders" to "service_role";

grant truncate on table "public"."orders" to "service_role";

grant update on table "public"."orders" to "service_role";


  create policy "Allow all for anon"
  on "public"."categories"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on categories"
  on "public"."categories"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "categories_read_auth"
  on "public"."categories"
  as permissive
  for select
  to public
using (((auth.role() = 'authenticated'::text) OR (auth.role() = 'anon'::text)));



  create policy "Allow all for anon"
  on "public"."customers"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on customers"
  on "public"."customers"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Enable all access for authenticated users"
  on "public"."extra_order_item_variations"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Enable all access for authenticated users"
  on "public"."extra_order_items"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow anon write access on food_item_add_ons"
  on "public"."food_item_add_ons"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated write access on food_item_add_ons"
  on "public"."food_item_add_ons"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow public read access on food_item_add_ons"
  on "public"."food_item_add_ons"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all operations for authenticated users on food_item_custo"
  on "public"."food_item_custom_liters"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow anon write access on food_item_preparations"
  on "public"."food_item_preparations"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated write access on food_item_preparations"
  on "public"."food_item_preparations"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow public read access on food_item_preparations"
  on "public"."food_item_preparations"
  as permissive
  for select
  to public
using (true);



  create policy "Allow anon write access on food_item_variations"
  on "public"."food_item_variations"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow public read access on food_item_variations"
  on "public"."food_item_variations"
  as permissive
  for select
  to public
using (true);



  create policy "Allow all for anon"
  on "public"."food_items"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on food_items"
  on "public"."food_items"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "food_items_read_auth"
  on "public"."food_items"
  as permissive
  for select
  to public
using (((auth.role() = 'authenticated'::text) OR (auth.role() = 'anon'::text)));



  create policy "Allow all for anon"
  on "public"."liter_sizes"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on liter_sizes"
  on "public"."liter_sizes"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all for anon"
  on "public"."order_items"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on order_items"
  on "public"."order_items"
  as permissive
  for all
  to authenticated
using (true)
with check (true);



  create policy "Allow all for anon"
  on "public"."orders"
  as permissive
  for all
  to anon
using (true)
with check (true);



  create policy "Allow authenticated access on orders"
  on "public"."orders"
  as permissive
  for all
  to authenticated
using (true)
with check (true);


CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


