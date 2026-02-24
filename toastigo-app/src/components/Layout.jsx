import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { VALENTINE_MODE } from '../config';
import { ShoppingBag, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { cart, toggleCart } = useCart();
  const theme = VALENTINE_MODE ? "text-[#8C0E38] border-[#8C0E38]" : "text-[#005fb9] border-[#005fb9]";

  // Calculate total quantity for the red badge
  const totalItems = cart ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;

  return (
    <nav className={`fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b-2 ${theme}`}>
      <Link to="/" className="text-2xl font-black tracking-tighter hover:opacity-70 transition-opacity">
        toastigo.
      </Link>
      
      <div className="flex gap-4 items-center">
        <Link to="/gallery" className="font-bold hover:underline hidden md:block">Gallery</Link>
        <Link to="/order" className="font-bold hover:underline hidden md:block">Order</Link>
        
        <button onClick={toggleCart} className={`relative p-2 rounded-full border-2 ${theme} hover:scale-105 transition-transform bg-white`}>
          <ShoppingBag size={20} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

const CartDrawer = () => {
  const { isCartOpen, toggleCart, cart, removeFromCart } = useCart();
  
  // Calculate total
  const total = cart ? cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) : 0;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleCart} className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
          />
          
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Your Cart</h2>
              <button onClick={toggleCart}><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {!cart || cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                  <ShoppingBag size={48} />
                  <p className="font-bold">Your cart is empty.</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={item.id || i} className="flex gap-4 p-4 rounded-xl border-2 border-gray-100 bg-gray-50">
                    <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 shadow-sm" style={{ backgroundColor: item.color }}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold leading-tight">{item.name}</h4>
                        <p className="font-bold text-lg">
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                      
                      <p className="text-sm opacity-60">{item.text || "No custom text"}</p>
                      
                      <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase">
                        <span className="bg-white px-2 py-1 rounded border border-gray-200">
                          Qty: {item.quantity || 1}
                        </span>
                        <span>x ${item.price}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => removeFromCart(item.id || i)} 
                      className="text-red-400 hover:text-red-600 self-center p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between text-xl font-black mb-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {/* THIS IS THE ONLY CHANGE: Replaces the button with a Link to /checkout */}
              <Link 
                to="/checkout"
                onClick={toggleCart}
                className="block w-full text-center py-4 bg-black text-white font-bold rounded-xl hover:opacity-80 transition-opacity"
              >
                Checkout
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Layout = () => {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <div className="pt-20"> 
        <Outlet /> 
      </div>
    </>
  );
};

export default Layout;