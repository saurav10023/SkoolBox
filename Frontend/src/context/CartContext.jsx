import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import API from "../api/axios";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // derived count for navbar badge
  const cartCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  // fetch cart whenever user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // clear cart on logout
      setCart(null);
      setTotal(0);
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/v1/cart");
      if (Array.isArray(res.data.data)) {
        // empty cart returns []
        setCart({ items: [] });
        setTotal(0);
      } else {
        setCart(res.data.data.cart);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, size, quantity) => {
    try {
      await API.post("/api/v1/cart", { productId, size, quantity });
      await fetchCart(); // refresh cart after adding
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to add to cart";
      return { success: false, message };
    }
  };

  const updateItem = async (productId, size, quantity) => {
    try {
      await API.patch("/api/v1/cart", { productId, size, quantity });
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update item";
      return { success: false, message };
    }
  };

  const removeItem = async (productId, size) => {
    try {
      await API.delete("/api/v1/cart/item", { data: { productId, size } });
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to remove item";
      return { success: false, message };
    }
  };

  const clearCart = async () => {
    try {
      await API.delete("/api/v1/cart");
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to clear cart";
      return { success: false, message };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        cartCount,
        loading,
        error,
        fetchCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);