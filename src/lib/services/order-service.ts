import { createClient } from "@/lib/supabase/client";
import { Customer, Order, OrderItem } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface SaveOrderInput {
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  order: {
    order_date: string;
    order_time: string;
    delivery_address: string;
    notes: string;
  };
  items: {
    food_item_id: string;
    liter_size_id: string | null;
    size_type?: "big" | "small" | null; // For size-based measurements (ג/ק)
    quantity: number;
    item_note?: string | null; // Free-text note for this item
    preparation_id?: string | null; // Selected preparation option
    variation_id?: string | null; // For items with variations (e.g., rice types)
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
  address: string
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
      input.customer.address
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
        delivery_address: input.order.delivery_address || null,
        notes: input.order.notes || null,
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

    // 3. Create order items (filter out items with 0 quantity)
    const orderItems = input.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        id: uuidv4(),
        order_id: orderId,
        food_item_id: item.food_item_id,
        liter_size_id: item.liter_size_id || null,
        size_type: item.size_type || null, // For size-based measurements (ג/ק)
        quantity: item.quantity,
        item_note: item.item_note || null, // Free-text note for this item
        preparation_id: item.preparation_id || null, // Selected preparation option
        variation_id: item.variation_id || null, // For items with variations (e.g., rice types)
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
  delivery_address: string | null;
  notes: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
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
  })[];
}

/**
 * Get orders by date range with customer and items
 */
export async function getOrdersByDateRange(
  fromDate: string,
  toDate: string
): Promise<OrderWithDetails[]> {
  const supabase = createClient();

  // Get orders in date range
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(*)
    `)
    .gte("order_date", fromDate)
    .lte("order_date", toDate)
    .order("order_date", { ascending: true })
    .order("order_time", { ascending: true });

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
      liter_size:liter_sizes(id, label, size)
    `)
    .in("order_id", orderIds);

  if (itemsError) {
    console.error("Error fetching order items:", itemsError);
  }

  // Combine orders with their items
  return orders.map((order) => ({
    ...order,
    items: (items || []).filter((item) => item.order_id === order.id),
  }));
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
  // For regular items
  total_quantity?: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  items: SummaryItem[];
}

/**
 * Get aggregated summary for date range
 */
export async function getOrdersSummary(
  fromDate: string,
  toDate: string
): Promise<CategorySummary[]> {
  const supabase = createClient();

  // Get categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  // Get all order items in date range with joins
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .gte("order_date", fromDate)
    .lte("order_date", toDate);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((o) => o.id);

  const { data: items } = await supabase
    .from("order_items")
    .select(`
      *,
      food_item:food_items(id, name, category_id, has_liters),
      liter_size:liter_sizes(id, label, size)
    `)
    .in("order_id", orderIds);

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
    const foodItemId = item.food_item_id;

    if (!categoryItems.has(foodItemId)) {
      categoryItems.set(foodItemId, {
        food_item_id: foodItemId,
        food_name: item.food_item.name,
        category_id: categoryId,
        category_name: category.name,
        has_liters: item.food_item.has_liters,
        liter_quantities: item.food_item.has_liters ? [] : undefined,
        total_quantity: item.food_item.has_liters ? undefined : 0,
      });
    }

    const summaryItem = categoryItems.get(foodItemId)!;

    if (item.food_item.has_liters && item.liter_size) {
      // Add to liter quantities
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
    } else {
      // Add to total quantity
      summaryItem.total_quantity = (summaryItem.total_quantity || 0) + item.quantity;
    }
  }

  // Convert to array and sort
  const result: CategorySummary[] = [];
  for (const category of categories) {
    const categoryItems = summaryMap.get(category.id);
    if (categoryItems && categoryItems.size > 0) {
      result.push({
        category_id: category.id,
        category_name: category.name,
        items: Array.from(categoryItems.values()).sort((a, b) =>
          a.food_name.localeCompare(b.food_name, "he")
        ),
      });
    }
  }

  return result;
}
