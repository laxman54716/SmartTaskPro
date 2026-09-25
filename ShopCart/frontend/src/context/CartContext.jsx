import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setCart(res.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch cart', err);
      setError(err.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await api.post('/cart/items', { product_id: productId, quantity });
      setCart(res.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add item' };
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${itemId}`, { quantity });
      setCart(res.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update quantity' };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/cart/items/${itemId}`);
      setCart(res.data.data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart(null);
      await fetchCart(); // Re-fetch to get empty cart state
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to clear cart' };
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, error, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
