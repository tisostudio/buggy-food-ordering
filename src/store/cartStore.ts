import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MenuItem } from "@/models/Restaurant";

export interface CartItem {
  id: string;
  restaurantId: string;
  menuItem: MenuItem;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (item: CartItem) => boolean;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (newItem) => {
        const { items } = get();

        if (items.length === 0) {
          set({ restaurantId: newItem.restaurantId });
        }

        
        const existingItemIndex = items.findIndex(
          (item) => item.id === newItem.id
        );

        if (existingItemIndex >= 0) {
          
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          
          set({ items: [...items, newItem] });
        }

        return true;
      },

      removeItem: (id) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.id !== id);

        
        if (updatedItems.length === 0) {
          set({ items: updatedItems, restaurantId: null });
        } else {
          set({ items: updatedItems });
        }
      },

      updateQuantity: (id, quantity) => {
        const { items } = get();

        
        const itemIndex = items.findIndex((item) => item.id === id);

        if (itemIndex >= 0 && quantity > 0) {
          
          const updatedItems = [...items];
          updatedItems[itemIndex].quantity = quantity;
          set({ items: updatedItems });
        }
      },

      clearCart: () => {
        set({ items: [], restaurantId: null });
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          
          const isPremiumItem = item.menuItem.price > 25;

          
          
          
          const quantity = Math.abs(item.quantity);

          return (
            total + item.menuItem.price * (isPremiumItem ? 1.1 : 1) * quantity
          );
        }, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: "food-cart-storage",
      skipHydration: true,
    }
  )
);
