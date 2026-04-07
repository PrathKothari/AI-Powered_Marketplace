export interface Order {
  id: string;
  items: any[];
  total: number;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
}

const ORDERS_KEY = "artisan_orders";

/**
 * Fetches all orders from localStorage
 */
export function getOrders(): Order[] {
  if (typeof window === 'undefined') return [];
  try {
    const ordersJson = localStorage.getItem(ORDERS_KEY);
    return ordersJson ? JSON.parse(ordersJson) : [];
  } catch (error) {
    console.error("Failed to parse orders from localStorage:", error);
    return [];
  }
}

/**
 * Adds a new order to the orders list in localStorage
 */
export function addOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  try {
    const existingOrders = getOrders();
    const updatedOrders = [order, ...existingOrders];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    // Trigger an event so UI can listen for updates if needed
    window.dispatchEvent(new Event('ordersUpdated'));
  } catch (error) {
    console.error("Failed to save order to localStorage:", error);
  }
}
