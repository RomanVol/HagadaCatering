import { createClient } from "@/lib/supabase/client";
import { Customer, Order, OrderItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface SaveOrderInput {
  customer: {
    name: string;
    phone: string;
    phone_alt?: string;
    address: string;
  };
  order: {
    order_date: string;
    order_time: string;
    customer_time?: string;
    delivery_address: string;
    notes: string;
    total_portions?: number;
    price_per_portion?: number;
    delivery_fee?: number;
  };
  items: {
    food_item_id: string;
    liter_size_id: string | null;
    size_type?: "big" | "small" | null; // For size-based measurements (ג/ק)
    quantity: number;
    item_note?: string | null; // Free-text note for this item
    preparation_id?: string | null; // Selected preparation option
    variation_id?: string | null; // For items with variations (e.g., rice types)
    add_on_id?: string | null; // For add-on items (e.g., רוטב לרול)
  }[];
}

export interface SaveOrderResult {
  success: boolean;
  order?: Order;
  customer?: Customer;
  error?: string;
}

/**
 * Find or create a customer by phone number.
 * If customer exists, update their name and address.
 */
export async function findOrCreateCustomer(
  phone: string,
  name: string,
  address: string,
  phone_alt?: string
): Promise<{ customer: Customer | null; error: string | null }> {
  const supabase = createClient();

  // First, try to find existing customer by phone
  const { data: existingCustomer, error: findError } = await supabase
    .from("customers")
    .select("*")
    .eq("phone", phone)
    .single();

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 = no rows found, which is fine
    return { customer: null, error: findError.message };
  }

  if (existingCustomer) {
    // Update customer info if changed
    const { data: updatedCustomer, error: updateError } = await supabase
      .from("customers")
      .update({
        name: name || existingCustomer.name,
        address: address || existingCustomer.address,
        phone_alt: phone_alt || existingCustomer.phone_alt || null,
      })
      .eq("id", existingCustomer.id)
      .select()
      .single();

    if (updateError) {
      return { customer: null, error: updateError.message };
    }

    return { customer: updatedCustomer, error: null };
  }

  // Create new customer
  const { data: newCustomer, error: createError } = await supabase
    .from("customers")
    .insert({
      id: uuidv4(),
      phone,
      name,
      address,
      phone_alt: phone_alt || null,
    })
    .select()
    .single();

  if (createError) {
    return { customer: null, error: createError.message };
  }

  return { customer: newCustomer, error: null };
}

/**
 * Save an order with all its items.
 * Creates or finds customer by phone, then creates order and order items.
 */
export async function saveOrder(input: SaveOrderInput): Promise<SaveOrderResult> {
  const supabase = createClient();

  try {
    // 1. Find or create customer
    const { customer, error: customerError } = await findOrCreateCustomer(
      input.customer.phone,
      input.customer.name,
      input.customer.address,
      input.customer.phone_alt
    );

    if (customerError || !customer) {
      return {
        success: false,
        error: customerError || "Failed to create customer",
      };
    }

    // 2. Create the order
    const orderId = uuidv4();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        id: orderId,
        customer_id: customer.id,
        order_date: input.order.order_date,
        order_time: input.order.order_time || null,
        customer_time: input.order.customer_time || null,
        delivery_address: input.order.delivery_address || null,
        notes: input.order.notes || null,
        total_portions: input.order.total_portions || null,
        price_per_portion: input.order.price_per_portion || null,
        delivery_fee: input.order.delivery_fee || null,
        status: "active",
      })
      .select()
      .single();

    if (orderError) {
      return {
        success: false,
        error: orderError.message,
      };
    }

    // Helper function to get valid liter_size_id (null for custom liters)
    const getValidLiterSizeId = (literSizeId: string | null): string | null => {
      if (!literSizeId) return null;
      // Custom liter IDs start with "custom_" - these are not valid UUIDs for the liter_sizes table
      if (literSizeId.startsWith("custom_")) {
        return null;
      }
      return literSizeId;
    };

    // 3. Create order items (filter out items with 0 quantity)
    const orderItems = input.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        id: uuidv4(),
        order_id: orderId,
        food_item_id: item.food_item_id,
        liter_size_id: getValidLiterSizeId(item.liter_size_id),
        size_type: item.size_type || null, // For size-based measurements (ג/ק)
        quantity: item.quantity,
        item_note: item.item_note || null, // Free-text note for this item
        preparation_id: item.preparation_id || null, // Selected preparation option
        variation_id: item.variation_id || null, // For items with variations (e.g., rice types)
        add_on_id: item.add_on_id || null, // For add-on items
      }));

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        // Try to delete the order if items failed
        await supabase.from("orders").delete().eq("id", orderId);
        return {
          success: false,
          error: itemsError.message,
        };
      }
    }

    return {
      success: true,
      order,
      customer,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get all orders for a customer by phone number
 */
export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const supabase = createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .single();

  if (!customer) {
    return [];
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return orders || [];
}

/**
 * Get order with all its items
 */
export async function getOrderWithItems(orderId: string): Promise<{
  order: Order | null;
  items: OrderItem[];
}> {
  const supabase = createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, customer:customers(*)")
    .eq("id", orderId)
    .single();

  if (orderError) {
    console.error("Error fetching order:", orderError);
    return { order: null, items: [] };
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
    return { order, items: [] };
  }

  return { order, items: items || [] };
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: "draft" | "active" | "completed" | "cancelled"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Order with customer and items joined
 */
export interface OrderWithDetails {
  id: string;
  order_number: number;
  customer_id: string | null;
  order_date: string;
  order_time: string | null;
  customer_time: string | null;
  delivery_address: string | null;
  notes: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  // Pricing fields
  total_portions: number | null;
  price_per_portion: number | null;
  delivery_fee: number | null;
  created_at: string;
  updated_at: string;
  customer: Customer | null;
  items: (OrderItem & {
    food_item?: {
      id: string;
      name: string;
      category_id: string;
      has_liters: boolean;
    };
    liter_size?: {
      id: string;
      label: string;
      size: number;
    };
    preparation?: {
      id: string;
      name: string;
    };
  })[];
}

/**
 * Filter options for orders query
 */
export interface OrderFilters {
  fromDate?: string;
  toDate?: string;
  customerName?: string;
  phone?: string;
}

/**
 * Get orders by filters (date range, customer name, phone) with customer and items
 * All filters are optional and work independently
 */
export async function getOrdersByDateRange(
  fromDate?: string,
  toDate?: string,
  filters?: { customerName?: string; phone?: string }
): Promise<OrderWithDetails[]> {
  const supabase = createClient();

  // Build query with optional filters
  let query = supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*)
    `);

  // Apply date filters only if provided
  if (fromDate) {
    query = query.gte("order_date", fromDate);
  }
  if (toDate) {
    query = query.lte("order_date", toDate);
  }

  // Order results
  query = query
    .order("order_date", { ascending: true })
    .order("order_time", { ascending: true });

  const { data: orders, error: ordersError } = await query;

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return [];
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  // Get all order items for these orders
  const orderIds = orders.map((o) => o.id);
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      food_item:food_items(id, name, category_id, has_liters),
      liter_size:liter_sizes(id, label, size),
      preparation:food_item_preparations(id, name)
    `)
    .in("order_id", orderIds);

  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
  }

  // Combine orders with their items
  let result = orders.map((order) => ({
    ...order,
    items: (items || []).filter((item) => item.order_id === order.id),
  }));

  // Apply customer name filter (client-side for joined table)
  if (filters?.customerName) {
    const searchName = filters.customerName.toLowerCase();
    result = result.filter((order) =>
      order.customer?.name?.toLowerCase().includes(searchName)
    );
  }

  // Apply phone filter (client-side for joined table) - checks both phone and phone_alt
  if (filters?.phone) {
    result = result.filter((order) =>
      order.customer?.phone?.includes(filters.phone!) ||
      order.customer?.phone_alt?.includes(filters.phone!)
    );
  }

  return result;
}

/**
 * Summary aggregation by category and food item
 */
export interface SummaryItem {
  food_item_id: string;
  food_name: string;
  category_id: string;
  category_name: string;
  has_liters: boolean;
  // For items with liters
  liter_quantities?: {
    liter_size_id: string;
    liter_label: string;
    liter_size: number;
    total_quantity: number;
  }[];
  // For items with size_type (ג/ק)
  size_quantities?: {
    size_type: "big" | "small";
    size_label: string;
    total_quantity: number;
  }[];
  // For regular items
  total_quantity?: number;
  // Is this an add-on item?
  is_add_on?: boolean;
  parent_food_name?: string;
  // Is this a variation item?
  is_variation?: boolean;
  variation_name?: string;
  // Portion calculation (for mains like שניצל, קציצות, בשר לפי גרם)
  portion_multiplier?: number | null;
  portion_unit?: string | null;
  // Preparation method (e.g., עשבי תיבול, ברוטב)
  has_preparation?: boolean;
  preparation_name?: string | null;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  items: SummaryItem[];
}

/**
 * Get aggregated summary for date range
 * Includes: liter quantities, size quantities (ג/ק), add-ons separately, and variations separately
 */
export async function getOrdersSummary(
  fromDate?: string,
  toDate?: string,
  filters?: { customerName?: string; phone?: string }
): Promise<CategorySummary[]> {
  const supabase = createClient();

  // Get categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  console.log("Categories:", categories?.length, "error:", catError);

  // Build orders query with optional date filters
  let ordersQuery = supabase
    .from("orders")
    .select("id, customer:customers(name, phone)");

  if (fromDate) {
    ordersQuery = ordersQuery.gte("order_date", fromDate);
  }
  if (toDate) {
    ordersQuery = ordersQuery.lte("order_date", toDate);
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  console.log("Orders in range:", orders?.length, "error:", ordersError);

  if (!orders || orders.length === 0) {
    return [];
  }

  // Filter orders by customer name and phone (client-side for joined table)
  let filteredOrders = orders;
  if (filters?.customerName) {
    const searchName = filters.customerName.toLowerCase();
    filteredOrders = filteredOrders.filter((order) =>
      (order.customer as { name?: string; phone?: string; phone_alt?: string } | null)?.name?.toLowerCase().includes(searchName)
    );
  }
  if (filters?.phone) {
    filteredOrders = filteredOrders.filter((order) => {
      const customer = order.customer as { name?: string; phone?: string; phone_alt?: string } | null;
      return customer?.phone?.includes(filters.phone!) || customer?.phone_alt?.includes(filters.phone!);
    });
  }

  if (filteredOrders.length === 0) {
    return [];
  }

  const orderIds = filteredOrders.map((o) => o.id);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      food_item:food_items(id, name, category_id, has_liters, portion_multiplier, portion_unit),
      liter_size:liter_sizes(id, label, size)
    `)
    .in("order_id", orderIds);

  console.log("Order items:", items?.length, "error:", itemsError);

  // Get add-on names and measurement_type separately if there are items with add_on_id
  const itemsWithAddOns = items?.filter(i => i.add_on_id) || [];
  const addOnsMap = new Map<string, { name: string; measurement_type: string }>();

  if (itemsWithAddOns.length > 0) {
    const addOnIds = [...new Set(itemsWithAddOns.map(i => i.add_on_id))];
    const { data: addOns } = await supabase
      .from("food_item_add_ons")
      .select("id, name, measurement_type")
      .in("id", addOnIds);

    if (addOns) {
      addOns.forEach(ao => addOnsMap.set(ao.id, { name: ao.name, measurement_type: ao.measurement_type || 'none' }));
    }
  }

  // Get variation names separately if there are items with variation_id
  const itemsWithVariations = items?.filter(i => i.variation_id) || [];
  const variationsMap = new Map<string, string>();
  
  if (itemsWithVariations.length > 0) {
    const variationIds = [...new Set(itemsWithVariations.map(i => i.variation_id))];
    const { data: variations } = await supabase
      .from("food_item_variations")
      .select("id, name")
      .in("id", variationIds);
    
    if (variations) {
      variations.forEach(v => variationsMap.set(v.id, v.name));
    }
  }

  // Get preparation names separately if there are items with preparation_id
  const itemsWithPreparations = items?.filter(i => i.preparation_id) || [];
  const preparationsMap = new Map<string, string>();
  
  if (itemsWithPreparations.length > 0) {
    const preparationIds = [...new Set(itemsWithPreparations.map(i => i.preparation_id))];
    const { data: preparations } = await supabase
      .from("food_item_preparations")
      .select("id, name")
      .in("id", preparationIds);
    
    if (preparations) {
      preparations.forEach(p => preparationsMap.set(p.id, p.name));
    }
  }

  if (!items || !categories) {
    return [];
  }

  // Aggregate by category and food item
  const summaryMap = new Map<string, Map<string, SummaryItem>>();

  for (const item of items) {
    if (!item.food_item) continue;

    const categoryId = item.food_item.category_id;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) continue;

    if (!summaryMap.has(categoryId)) {
      summaryMap.set(categoryId, new Map());
    }

    const categoryItems = summaryMap.get(categoryId)!;
    
    // Check if this is an add-on item
    const addOnInfo = item.add_on_id ? addOnsMap.get(item.add_on_id) : null;
    const addOnName = addOnInfo?.name;
    const addOnMeasurementType = addOnInfo?.measurement_type;
    const isAddOn = !!item.add_on_id && !!addOnName;
    
    // Check if this is a variation item
    const variationName = item.variation_id ? variationsMap.get(item.variation_id) : null;
    const isVariation = !!item.variation_id && !!variationName;
    
    // Check if this item has a preparation
    const preparationName = item.preparation_id ? preparationsMap.get(item.preparation_id) : null;
    const hasPreparation = !!item.preparation_id && !!preparationName;
    
    // Create unique key: include add_on_id, variation_id, and preparation_id for uniqueness
    let itemKey = item.food_item_id;
    if (isAddOn) {
      itemKey = `${item.food_item_id}_addon_${item.add_on_id}`;
    } else if (isVariation) {
      itemKey = `${item.food_item_id}_variation_${item.variation_id}`;
    } else if (hasPreparation) {
      itemKey = `${item.food_item_id}_prep_${item.preparation_id}`;
    }
    
    // Build display name
    let displayName = item.food_item.name;
    if (isAddOn) {
      displayName = `${addOnName} (תוספת ל${item.food_item.name})`;
    } else if (isVariation) {
      displayName = `${item.food_item.name} - ${variationName}`;
    } else if (hasPreparation) {
      displayName = `${item.food_item.name} (${preparationName})`;
    }

    if (!categoryItems.has(itemKey)) {
      // For add-ons, use the add-on's measurement_type to determine has_liters
      // For regular items, use the food item's has_liters
      const hasLiters = isAddOn
        ? addOnMeasurementType === 'liters'
        : item.food_item.has_liters;

      categoryItems.set(itemKey, {
        food_item_id: item.food_item_id,
        food_name: displayName,
        category_id: categoryId,
        category_name: category.name,
        has_liters: hasLiters,
        liter_quantities: [],
        size_quantities: [],
        total_quantity: 0,
        is_add_on: isAddOn,
        parent_food_name: isAddOn ? item.food_item.name : undefined,
        is_variation: isVariation,
        variation_name: isVariation ? variationName : undefined,
        portion_multiplier: item.food_item.portion_multiplier,
        portion_unit: item.food_item.portion_unit,
        has_preparation: hasPreparation,
        preparation_name: hasPreparation ? preparationName : undefined,
      });
    }

    const summaryItem = categoryItems.get(itemKey)!;

    // Handle liter-based quantities
    if (item.liter_size_id && item.liter_size) {
      const existingLiter = summaryItem.liter_quantities?.find(
        (lq) => lq.liter_size_id === item.liter_size_id
      );
      if (existingLiter) {
        existingLiter.total_quantity += item.quantity;
      } else {
        summaryItem.liter_quantities?.push({
          liter_size_id: item.liter_size_id!,
          liter_label: item.liter_size.label,
          liter_size: item.liter_size.size,
          total_quantity: item.quantity,
        });
      }
    } 
    // Handle size-based quantities (ג/ק)
    else if (item.size_type) {
      const existingSize = summaryItem.size_quantities?.find(
        (sq) => sq.size_type === item.size_type
      );
      if (existingSize) {
        existingSize.total_quantity += item.quantity;
      } else {
        summaryItem.size_quantities?.push({
          size_type: item.size_type as "big" | "small",
          size_label: item.size_type === "big" ? "ג׳" : "ק׳",
          total_quantity: item.quantity,
        });
      }
    }
    // Handle regular quantities
    else {
      summaryItem.total_quantity = (summaryItem.total_quantity || 0) + item.quantity;
    }
  }

  // Convert to array and sort
  const result: CategorySummary[] = [];
  for (const category of categories) {
    const categoryItems = summaryMap.get(category.id);
    if (categoryItems && categoryItems.size > 0) {
      // Sort: main items first, then variations, then add-ons
      const sortedItems = Array.from(categoryItems.values()).sort((a, b) => {
        // Add-ons come last
        if (a.is_add_on && !b.is_add_on) return 1;
        if (!a.is_add_on && b.is_add_on) return -1;
        // Variations come after main items but before add-ons
        if (a.is_variation && !b.is_variation && !b.is_add_on) return 1;
        if (!a.is_variation && b.is_variation && !a.is_add_on) return -1;
        // Then sort alphabetically
        return a.food_name.localeCompare(b.food_name, "he");
      });
      
      result.push({
        category_id: category.id,
        category_name: category.name,
        items: sortedItems,
      });
    }
  }

  return result;
}

/**
 * Update an existing order
 */
export interface UpdateOrderInput {
  customer: {
    name: string;
    phone: string;
    phone_alt?: string;
    address: string;
  };
  order: {
    order_date: string;
    order_time: string;
    customer_time?: string;
    delivery_address: string;
    notes: string;
    total_portions?: number;
    price_per_portion?: number;
    delivery_fee?: number;
  };
  salads: {
    food_item_id: string;
    selected: boolean;
    measurement_type: string;
    liters: { liter_size_id: string; quantity: number }[];
    size_big: number;
    size_small: number;
    regular_quantity: number;
    addOns: { addon_id: string; quantity: number; liters: { liter_size_id: string; quantity: number }[] }[];
    note: string;
  }[];
  middle_courses: {
    food_item_id: string;
    selected: boolean;
    quantity: number;
    preparation_id?: string;
    note?: string;
  }[];
  sides: {
    food_item_id: string;
    selected: boolean;
    size_big: number;
    size_small: number;
    preparation_id?: string;
    note?: string;
    variations?: { variation_id: string; size_big: number; size_small: number }[];
  }[];
  mains: {
    food_item_id: string;
    selected: boolean;
    quantity: number;
    preparation_id?: string;
    note?: string;
  }[];
  extras: {
    food_item_id: string;
    selected: boolean;
    measurement_type?: string;
    liters?: { liter_size_id: string; quantity: number }[];
    size_big?: number;
    size_small?: number;
    quantity: number;
    preparation_id?: string;
    note?: string;
  }[];
  bakery: {
    food_item_id: string;
    selected: boolean;
    measurement_type?: string;
    liters?: { liter_size_id: string; quantity: number }[];
    size_big?: number;
    size_small?: number;
    quantity: number;
    preparation_id?: string;
    note?: string;
  }[];
  // Extra items from mains/sides/middle_courses with custom prices
  extra_items?: {
    id: string;
    source_food_item_id: string;
    source_category: 'mains' | 'sides' | 'middle_courses';
    name: string;
    quantity?: number;
    size_big?: number;
    size_small?: number;
    variations?: { variation_id: string; name: string; size_big: number; size_small: number }[];
    price: number;
    note?: string;
    preparation_name?: string;
  }[];
}

export async function updateOrder(
  orderId: string,
  input: UpdateOrderInput
): Promise<SaveOrderResult> {
  const supabase = createClient();

  try {
    // 1. Update customer info
    const { customer, error: customerError } = await findOrCreateCustomer(
      input.customer.phone,
      input.customer.name,
      input.customer.address,
      input.customer.phone_alt
    );

    if (customerError || !customer) {
      return { success: false, error: customerError || "Failed to update customer" };
    }

    // 2. Update the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({
        customer_id: customer.id,
        order_date: input.order.order_date,
        order_time: input.order.order_time || null,
        customer_time: input.order.customer_time || null,
        delivery_address: input.order.delivery_address || null,
        notes: input.order.notes || null,
        total_portions: input.order.total_portions || null,
        price_per_portion: input.order.price_per_portion || null,
        delivery_fee: input.order.delivery_fee || null,
      })
      .eq("id", orderId)
      .select()
      .single();

    if (orderError) {
      return { success: false, error: orderError.message };
    }

    // 3. Delete all existing order items
    const { error: deleteError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // 4. Create new order items
    const orderItems: {
      id: string;
      order_id: string;
      food_item_id: string;
      liter_size_id: string | null;
      size_type: string | null;
      quantity: number;
      item_note: string | null;
      preparation_id: string | null;
      variation_id: string | null;
      add_on_id: string | null;
    }[] = [];

    // Helper function to get valid liter_size_id (null for custom liters)
    const getValidLiterSizeId = (literSizeId: string): string | null => {
      // Custom liter IDs start with "custom_" - these are not valid UUIDs for the liter_sizes table
      if (literSizeId.startsWith("custom_")) {
        return null;
      }
      return literSizeId;
    };

    // Add salad items
    for (const salad of input.salads) {
      if (!salad.selected) continue;
      let isFirstItem = true;

      if (salad.measurement_type === "liters") {
        for (const liter of salad.liters) {
          if (liter.quantity > 0) {
            orderItems.push({
              id: uuidv4(),
              order_id: orderId,
              food_item_id: salad.food_item_id,
              liter_size_id: getValidLiterSizeId(liter.liter_size_id),
              size_type: null,
              quantity: liter.quantity,
              item_note: isFirstItem && salad.note ? salad.note : null,
              preparation_id: null,
              variation_id: null,
              add_on_id: null,
            });
            isFirstItem = false;
          }
        }
      } else if (salad.measurement_type === "size") {
        if (salad.size_big > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: salad.food_item_id,
            liter_size_id: null,
            size_type: "big",
            quantity: salad.size_big,
            item_note: isFirstItem && salad.note ? salad.note : null,
            preparation_id: null,
            variation_id: null,
            add_on_id: null,
          });
          isFirstItem = false;
        }
        if (salad.size_small > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: salad.food_item_id,
            liter_size_id: null,
            size_type: "small",
            quantity: salad.size_small,
            item_note: isFirstItem && salad.note ? salad.note : null,
            preparation_id: null,
            variation_id: null,
            add_on_id: null,
          });
          isFirstItem = false;
        }
      } else if (salad.regular_quantity > 0) {
        orderItems.push({
          id: uuidv4(),
          order_id: orderId,
          food_item_id: salad.food_item_id,
          liter_size_id: null,
          size_type: null,
          quantity: salad.regular_quantity,
          item_note: salad.note || null,
          preparation_id: null,
          variation_id: null,
          add_on_id: null,
        });
      }

      // Add add-on items
      for (const addOn of salad.addOns) {
        if (addOn.quantity > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: salad.food_item_id,
            liter_size_id: null,
            size_type: null,
            quantity: addOn.quantity,
            item_note: null,
            preparation_id: null,
            variation_id: null,
            add_on_id: addOn.addon_id,
          });
        } else {
          for (const liter of addOn.liters) {
            if (liter.quantity > 0) {
              orderItems.push({
                id: uuidv4(),
                order_id: orderId,
                food_item_id: salad.food_item_id,
                liter_size_id: getValidLiterSizeId(liter.liter_size_id),
                size_type: null,
                quantity: liter.quantity,
                item_note: null,
                preparation_id: null,
                variation_id: null,
                add_on_id: addOn.addon_id,
              });
            }
          }
        }
      }
    }

    // Add middle courses, mains (simple quantity-based categories)
    const regularCategories = [
      { items: input.middle_courses },
      { items: input.mains },
    ];

    for (const category of regularCategories) {
      for (const item of category.items) {
        if (item.selected && item.quantity > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: item.food_item_id,
            liter_size_id: null,
            size_type: null,
            quantity: item.quantity,
            item_note: item.note || null,
            preparation_id: item.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
        }
      }
    }

    // Add extras items (supports all measurement types)
    for (const item of input.extras) {
      if (!item.selected) continue;
      let isFirstItem = true;
      const measurementType = item.measurement_type || "none";

      if (measurementType === "liters" && item.liters) {
        for (const liter of item.liters) {
          if (liter.quantity > 0) {
            orderItems.push({
              id: uuidv4(),
              order_id: orderId,
              food_item_id: item.food_item_id,
              liter_size_id: getValidLiterSizeId(liter.liter_size_id),
              size_type: null,
              quantity: liter.quantity,
              item_note: isFirstItem && item.note ? item.note : null,
              preparation_id: item.preparation_id || null,
              variation_id: null,
              add_on_id: null,
            });
            isFirstItem = false;
          }
        }
      } else if (measurementType === "size") {
        if (item.size_big && item.size_big > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: item.food_item_id,
            liter_size_id: null,
            size_type: "big",
            quantity: item.size_big,
            item_note: isFirstItem && item.note ? item.note : null,
            preparation_id: item.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
          isFirstItem = false;
        }
        if (item.size_small && item.size_small > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: item.food_item_id,
            liter_size_id: null,
            size_type: "small",
            quantity: item.size_small,
            item_note: isFirstItem && item.note ? item.note : null,
            preparation_id: item.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
        }
      } else if (item.quantity > 0) {
        orderItems.push({
          id: uuidv4(),
          order_id: orderId,
          food_item_id: item.food_item_id,
          liter_size_id: null,
          size_type: null,
          quantity: item.quantity,
          item_note: item.note || null,
          preparation_id: item.preparation_id || null,
          variation_id: null,
          add_on_id: null,
        });
      }
    }

    // Add bakery items (supports all measurement types like extras)
    for (const item of input.bakery) {
      if (!item.selected) continue;
      let isFirstItem = true;
      const measurementType = item.measurement_type || "none";

      if (measurementType === "liters" && item.liters) {
        for (const liter of item.liters) {
          if (liter.quantity > 0) {
            orderItems.push({
              id: uuidv4(),
              order_id: orderId,
              food_item_id: item.food_item_id,
              liter_size_id: getValidLiterSizeId(liter.liter_size_id),
              size_type: null,
              quantity: liter.quantity,
              item_note: isFirstItem && item.note ? item.note : null,
              preparation_id: item.preparation_id || null,
              variation_id: null,
              add_on_id: null,
            });
            isFirstItem = false;
          }
        }
      } else if (measurementType === "size") {
        if (item.size_big && item.size_big > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: item.food_item_id,
            liter_size_id: null,
            size_type: "big",
            quantity: item.size_big,
            item_note: isFirstItem && item.note ? item.note : null,
            preparation_id: item.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
          isFirstItem = false;
        }
        if (item.size_small && item.size_small > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: item.food_item_id,
            liter_size_id: null,
            size_type: "small",
            quantity: item.size_small,
            item_note: isFirstItem && item.note ? item.note : null,
            preparation_id: item.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
        }
      } else if (item.quantity > 0) {
        orderItems.push({
          id: uuidv4(),
          order_id: orderId,
          food_item_id: item.food_item_id,
          liter_size_id: null,
          size_type: null,
          quantity: item.quantity,
          item_note: item.note || null,
          preparation_id: item.preparation_id || null,
          variation_id: null,
          add_on_id: null,
        });
      }
    }

    // Add sides
    for (const side of input.sides) {
      if (!side.selected) continue;
      let isFirstItem = true;

      if (side.variations && side.variations.length > 0) {
        for (const variation of side.variations) {
          if (variation.size_big > 0) {
            orderItems.push({
              id: uuidv4(),
              order_id: orderId,
              food_item_id: side.food_item_id,
              liter_size_id: null,
              size_type: "big",
              quantity: variation.size_big,
              item_note: isFirstItem && side.note ? side.note : null,
              preparation_id: side.preparation_id || null,
              variation_id: variation.variation_id,
              add_on_id: null,
            });
            isFirstItem = false;
          }
          if (variation.size_small > 0) {
            orderItems.push({
              id: uuidv4(),
              order_id: orderId,
              food_item_id: side.food_item_id,
              liter_size_id: null,
              size_type: "small",
              quantity: variation.size_small,
              item_note: isFirstItem && side.note ? side.note : null,
              preparation_id: side.preparation_id || null,
              variation_id: variation.variation_id,
              add_on_id: null,
            });
            isFirstItem = false;
          }
        }
      } else {
        if (side.size_big > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: side.food_item_id,
            liter_size_id: null,
            size_type: "big",
            quantity: side.size_big,
            item_note: isFirstItem && side.note ? side.note : null,
            preparation_id: side.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
          isFirstItem = false;
        }
        if (side.size_small > 0) {
          orderItems.push({
            id: uuidv4(),
            order_id: orderId,
            food_item_id: side.food_item_id,
            liter_size_id: null,
            size_type: "small",
            quantity: side.size_small,
            item_note: isFirstItem && side.note ? side.note : null,
            preparation_id: side.preparation_id || null,
            variation_id: null,
            add_on_id: null,
          });
        }
      }
    }

    // Insert new order items
    if (orderItems.length > 0) {
      const { error: insertError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (insertError) {
        return { success: false, error: insertError.message };
      }
    }

    // Handle extra items (from mains/sides/middle_courses with custom prices)
    // First, delete existing extra_order_items for this order
    const { error: deleteExtraError } = await supabase
      .from("extra_order_items")
      .delete()
      .eq("order_id", orderId);

    if (deleteExtraError) {
      console.error("Error deleting extra order items:", deleteExtraError);
      // Don't fail the whole operation, just log the error
    }

    // Insert new extra items if any
    if (input.extra_items && input.extra_items.length > 0) {
      for (const extra of input.extra_items) {
        const { data: extraItem, error: extraError } = await supabase
          .from("extra_order_items")
          .insert({
            order_id: orderId,
            source_food_item_id: extra.source_food_item_id,
            source_category: extra.source_category,
            name: extra.name,
            quantity: extra.quantity || 0,
            size_big: extra.size_big || 0,
            size_small: extra.size_small || 0,
            price: extra.price,
            note: extra.note || null,
            preparation_name: extra.preparation_name || null,
          })
          .select()
          .single();

        if (extraError) {
          console.error("Error inserting extra order item:", extraError);
          continue;
        }

        // Insert variations if any
        if (extra.variations && extra.variations.length > 0 && extraItem) {
          const { error: variationError } = await supabase
            .from("extra_order_item_variations")
            .insert(
              extra.variations.map(v => ({
                extra_order_item_id: extraItem.id,
                variation_id: v.variation_id,
                name: v.name,
                size_big: v.size_big,
                size_small: v.size_small,
              }))
            );

          if (variationError) {
            console.error("Error inserting extra item variations:", variationError);
          }
        }
      }
    }

    return { success: true, order, customer };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
