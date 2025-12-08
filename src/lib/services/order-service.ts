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
  fromDate: string,
  toDate: string
): Promise<CategorySummary[]> {
  const supabase = createClient();

  // Get categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  console.log("Categories:", categories?.length, "error:", catError);

  // Get all order items in date range with joins
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .gte("order_date", fromDate)
    .lte("order_date", toDate);

  console.log("Orders in range:", orders?.length, "error:", ordersError);

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((o) => o.id);

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      food_item:food_items(id, name, category_id, has_liters),
      liter_size:liter_sizes(id, label, size)
    `)
    .in("order_id", orderIds);

  console.log("Order items:", items?.length, "error:", itemsError);

  // Get add-on names separately if there are items with add_on_id
  const itemsWithAddOns = items?.filter(i => i.add_on_id) || [];
  let addOnsMap = new Map<string, string>();
  
  if (itemsWithAddOns.length > 0) {
    const addOnIds = [...new Set(itemsWithAddOns.map(i => i.add_on_id))];
    const { data: addOns } = await supabase
      .from("food_item_add_ons")
      .select("id, name")
      .in("id", addOnIds);
    
    if (addOns) {
      addOns.forEach(ao => addOnsMap.set(ao.id, ao.name));
    }
  }

  // Get variation names separately if there are items with variation_id
  const itemsWithVariations = items?.filter(i => i.variation_id) || [];
  let variationsMap = new Map<string, string>();
  
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
    const addOnName = item.add_on_id ? addOnsMap.get(item.add_on_id) : null;
    const isAddOn = !!item.add_on_id && !!addOnName;
    
    // Check if this is a variation item
    const variationName = item.variation_id ? variationsMap.get(item.variation_id) : null;
    const isVariation = !!item.variation_id && !!variationName;
    
    // Create unique key: include add_on_id and variation_id for uniqueness
    let itemKey = item.food_item_id;
    if (isAddOn) {
      itemKey = `${item.food_item_id}_addon_${item.add_on_id}`;
    } else if (isVariation) {
      itemKey = `${item.food_item_id}_variation_${item.variation_id}`;
    }
    
    // Build display name
    let displayName = item.food_item.name;
    if (isAddOn) {
      displayName = `${addOnName} (תוספת ל${item.food_item.name})`;
    } else if (isVariation) {
      displayName = `${item.food_item.name} - ${variationName}`;
    }

    if (!categoryItems.has(itemKey)) {
      categoryItems.set(itemKey, {
        food_item_id: item.food_item_id,
        food_name: displayName,
        category_id: categoryId,
        category_name: category.name,
        has_liters: item.food_item.has_liters,
        liter_quantities: [],
        size_quantities: [],
        total_quantity: 0,
        is_add_on: isAddOn,
        parent_food_name: isAddOn ? item.food_item.name : undefined,
        is_variation: isVariation,
        variation_name: isVariation ? variationName : undefined,
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
    address: string;
  };
  order: {
    order_date: string;
    order_time: string;
    delivery_address: string;
    notes: string;
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
    quantity: number;
    preparation_id?: string;
    note?: string;
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
      input.customer.address
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
        delivery_address: input.order.delivery_address || null,
        notes: input.order.notes || null,
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
              liter_size_id: liter.liter_size_id,
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
                liter_size_id: liter.liter_size_id,
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

    // Add middle courses, mains, extras
    const regularCategories = [
      { items: input.middle_courses },
      { items: input.mains },
      { items: input.extras },
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

    return { success: true, order, customer };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

