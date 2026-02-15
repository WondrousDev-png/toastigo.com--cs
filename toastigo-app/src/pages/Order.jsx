import React, { useState, useEffect } from 'react';
import { VALENTINE_MODE } from '../config';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  ShoppingBag, Check, Plus, Minus, Type, 
  Wifi, Zap, Activity, Thermometer, X
} from 'lucide-react';

/* ==========================================================================
   🔧 OWNER CONFIGURATION
   ==========================================================================
*/
const PRODUCT_OPTIONS = [
  { id: 'yellow', name: 'New Yeller Yellow', hex: '#FDE668', price: 3.05, outOfStock: false },
  { id: 'dark',   name: 'Burnt Black',   hex: '#333333', price: 2.45, outOfStock: false }, 
  { id: 'pink',   name: 'Royal Pink',  hex: '#f95178', price: 3.05, outOfStock: true },
  { id: 'white',  name: 'Institutional White',    hex: '#ffffff', price: 2.45, outOfStock: false },
  { id: 'blue',   name: 'Royal Blue',       hex: '#11a9f5', price: 3, outOfStock: true },
];

const Order = () => {
  const { addToCart } = useCart();
  
  // State for Quantity, Custom Text, and Success Notification
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState("");
  const [showSuccess, setShowSuccess] = useState(false); 
  
  // Initialize with the first available color
  const [selectedColorId, setSelectedColorId] = useState(() => {
    const firstAvailable = PRODUCT_OPTIONS.find(p => !p.outOfStock);
    return firstAvailable ? firstAvailable.id : PRODUCT_OPTIONS[0].id;
  });

  const currentOption = PRODUCT_OPTIONS.find(o => o.id === selectedColorId) || PRODUCT_OPTIONS[0];
  const currentPrice = currentOption.price;

  // --- REAL PRINTER STATE ---
  const [printer, setPrinter] = useState({
    online: false,
    temp: 0,
    state: "INITIALIZING",
    percent: 0
  });

  const THEME = VALENTINE_MODE ? {
    bg: "bg-[#FFC5D3]", text: "text-[#8C0E38]", accent: "bg-[#D91C5C]", border: "border-[#8C0E38]", stroke: "#8C0E38",
    input: "bg-white/50 border-[#D91C5C] focus:ring-[#D91C5C]",
  } : {
    bg: "bg-[#FDE668]", text: "text-[#5A3E85]", accent: "bg-[#5A3E85]", border: "border-[#5A3E85]", stroke: "#5A3E85",
    input: "bg-white/50 border-[#5A3E85] focus:ring-[#5A3E85]",
  };

  // --- LIVE DATA FETCHING ---
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) throw new Error("Server not responding");
        const data = await res.json();
        setPrinter(data);
      } catch (error) {
        setPrinter(prev => ({ ...prev, online: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLE ADD TO CART ---
  const handleAddToCart = () => {
    const itemToAdd = {
      id: `${selectedColorId}-${customText}-${Date.now()}`,
      name: VALENTINE_MODE ? "Love Batch" : "Toastigo One",
      variantName: currentOption.name,
      price: currentPrice,
      color: currentOption.hex,
      text: customText,
      quantity: quantity, 
      totalPrice: (currentPrice * quantity).toFixed(2)
    };

    addToCart(itemToAdd);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setQuantity(1);
      setCustomText("");
    }, 2000);
  };

  const handleColorSelect = (opt) => {
    if (!opt.outOfStock) {
      setSelectedColorId(opt.id);
    }
  };

  const tempF = Math.round((printer.temp * 9/5) + 32);

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans p-4 md:p-12 transition-colors duration-500`}>
      {/* MOBILE FIX: 
          - Changed padding (p-4 mobile, p-12 desktop)
          - Grid is 1 column on mobile, 2 on desktop 
      */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start pt-4 md:pt-10 pb-20">
        
        {/* LEFT COLUMN: Visuals & Status 
            MOBILE FIX: Removed 'sticky' on mobile so it scrolls naturally. Kept 'md:sticky' for desktop.
        */}
        <div className="relative md:sticky md:top-24 space-y-6 order-1">
          
          <motion.div 
            layoutId="product-card"
            className={`relative w-full bg-white rounded-[2rem] md:rounded-[3rem] border-4 ${THEME.border} shadow-2xl p-6 md:p-10 flex flex-col items-center justify-center overflow-hidden`}
          >
            {/* 🍞 3D BREAD SVG */}
            <motion.div
               animate={{ 
                rotate: printer.state === "RUNNING" ? [0, 1, -1, 0] : 0,
                scale: printer.state === "RUNNING" ? [1, 1.02, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: 1 }}
              /* MOBILE FIX: 
                 - Replaced fixed w-64 with responsive width (w-full max-w-[...])
                 - Ensures it doesn't break on small screens (iPhone SE etc)
              */
              className="relative w-full max-w-[260px] md:max-w-[320px] aspect-square flex items-center justify-center"
            >
              <svg 
                viewBox="0 0 120 120" 
                className="w-full h-full drop-shadow-2xl overflow-visible"
              >
                {/* BACK LAYER (Depth) */}
                <path 
                  d="M35,90 C25,90 22,80 22,70 L25,40 C25,30 20,25 35,15 C50,5 80,5 95,15 C110,25 105,30 105,40 L108,70 C108,80 105,90 95,90 Z" 
                  fill="#C68E56" 
                  stroke="black"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {/* FRONT LAYER (Face) */}
                <motion.path 
                  initial={{ fill: currentOption.hex }}
                  animate={{ fill: currentOption.hex }}
                  transition={{ duration: 0.3 }}
                  stroke="black"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  d="M25,90 C15,90 12,80 12,70 L15,40 C15,30 10,25 25,15 C40,5 70,5 85,15 C100,25 95,30 95,40 L98,70 C98,80 95,90 85,90 Z"
                />
                {/* Pores/Texture */}
                <g fill="black" fillOpacity="0.1">
                  <ellipse cx="35" cy="40" rx="3" ry="5" transform="rotate(-15 35 40)" />
                  <ellipse cx="75" cy="30" rx="2" ry="2" />
                  <ellipse cx="65" cy="65" rx="4" ry="3" />
                  <ellipse cx="30" cy="75" rx="2" ry="2" />
                  <ellipse cx="85" cy="70" rx="3" ry="5" transform="rotate(15 85 70)" />
                </g>
                {/* Shine */}
                <path d="M30,20 C40,12 70,12 80,20" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </motion.div>

            {/* Custom "Added to Cart" Notification */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem]"
                >
                  <div className={`p-6 rounded-3xl ${THEME.bg} border-4 ${THEME.border} shadow-2xl flex flex-col items-center mx-4`}>
                    <Check size={48} className={THEME.text} strokeWidth={4} />
                    <h3 className="text-2xl font-black mt-2 uppercase">Added!</h3>
                    <p className="font-bold opacity-60 text-sm whitespace-nowrap">
                      {quantity} x {currentOption.name}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title & Preview */}
            <h3 className="text-3xl md:text-4xl font-black mt-4 mb-2 text-center tracking-tight leading-none">{VALENTINE_MODE ? "Love Batch" : "Toastigo One"}</h3>
            <p className="font-bold opacity-50 uppercase tracking-widest text-xs md:text-sm text-center">
              {currentOption.name}
            </p>

            <AnimatePresence>
              {customText && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`mt-4 px-4 py-2 rounded-lg border-2 ${THEME.border} bg-gray-50 font-mono text-sm uppercase break-all text-center max-w-full`}
                >
                  "{customText}"
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* REAL LIVE STATUS WIDGET */}
          <div className={`bg-white/40 backdrop-blur-md rounded-[2.5rem] border-2 ${THEME.border} p-5 md:p-6 overflow-hidden`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi size={18} className={printer.online ? "text-green-600" : "text-red-500 animate-pulse"} />
                <span className="font-bold text-xs md:text-sm uppercase opacity-70">
                  {printer.online ? "P1S LIVE FEED" : "SEARCHING..."}
                </span>
              </div>
              {printer.online && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-white/60 p-3 rounded-2xl border border-black/5 flex items-center gap-3">
                <Thermometer className="opacity-50 shrink-0 w-5 h-5" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold opacity-50">NOZZLE</div>
                  <div className="font-mono font-bold text-base md:text-xl truncate">{printer.online ? `${tempF}°F` : "--"}</div>
                </div>
              </div>
              <div className="bg-white/60 p-3 rounded-2xl border border-black/5 flex items-center gap-3">
                <Activity className="opacity-50 shrink-0 w-5 h-5" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold opacity-50">STATUS</div>
                  <div className="font-mono font-bold text-xs md:text-sm truncate uppercase">{printer.state || "OFFLINE"}</div>
                </div>
              </div>
            </div>
            {printer.percent > 0 && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[10px] font-black uppercase opacity-70">
                  <span>Current Job Progress</span>
                  <span>{printer.percent}%</span>
                </div>
                <div className="w-full h-3 bg-black/10 rounded-full overflow-hidden border border-black/5">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${printer.percent}%` }} 
                    className={`h-full ${THEME.accent}`} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Configurator Form 
            MOBILE FIX: Order-2 ensures it sits below the image on mobile
        */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8 md:space-y-10 md:pl-8 order-2"
        >
          <div>
            {/* MOBILE FIX: Smaller heading on mobile to prevent wrapping issues */}
            <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter">Configure.</h1>
            <p className="text-lg md:text-xl font-bold opacity-70">Build your perfect Toastigo.</p>
          </div>

          <div className="space-y-4">
            <label className="font-black text-sm uppercase opacity-60">Select Finish</label>
            {/* MOBILE FIX: 
                - gap-y-8: Adds vertical space so the "Sold Out" labels don't overlap the next row 
            */}
            <div className="flex flex-wrap gap-4 gap-y-8">
              {PRODUCT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleColorSelect(opt)}
                  disabled={opt.outOfStock}
                  className={`
                    group relative w-16 h-16 rounded-2xl border-4 transition-all duration-200
                    ring-4 ring-white/30
                    ${opt.outOfStock ? "opacity-40 cursor-not-allowed grayscale border-gray-300" : "cursor-pointer hover:scale-105 active:scale-95"}
                    ${selectedColorId === opt.id ? `${THEME.border} scale-110 shadow-xl opacity-100` : "border-white/50"}
                  `}
                  style={{ backgroundColor: opt.outOfStock ? '#e5e7eb' : opt.hex }}
                  title={`${opt.name} - ${opt.outOfStock ? "Sold Out" : `$${opt.price}`}`}
                >
                  {selectedColorId === opt.id && !opt.outOfStock && (
                    <div className={`absolute -top-3 -right-3 bg-white rounded-full p-1 border-2 ${THEME.border} shadow-sm z-10`}>
                      <Check size={12} strokeWidth={4} className="text-black" />
                    </div>
                  )}
                  {opt.outOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center">
                       <X size={24} className="text-gray-500 opacity-80" />
                       <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-gray-500 whitespace-nowrap bg-white/50 px-1 rounded">Sold Out</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-black text-sm uppercase opacity-60 flex items-center gap-2">
              <Type size={16} /> Custom Engraving (Optional)
            </label>
            <input 
              type="text" 
              maxLength={15}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="YOUR TEXT HERE"
              className={`w-full p-6 text-xl font-bold rounded-2xl border-4 outline-none transition-all placeholder:opacity-30 ${THEME.input} ${THEME.border}`}
            />
            <p className="text-xs font-bold opacity-40 text-right">{customText.length}/15 CHARS</p>
          </div>

          <div className={`p-6 rounded-[2.5rem] bg-white/40 border-2 ${THEME.border} flex flex-col gap-6`}>
            {/* MOBILE FIX: 
               - flex-wrap: Ensures price and quantity don't smash together on very small screens 
            */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4 bg-white rounded-xl p-2 border-2 border-black/5 shadow-sm">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Minus size={20}/></button>
                <span className="text-2xl font-black w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Plus size={20}/></button>
              </div>
              <div className="text-right ml-auto">
                <div className="text-3xl font-black">
                    <span className="text-lg opacity-50 mr-1">$</span>
                    {(currentPrice * quantity).toFixed(2)}
                </div>
                <div className="text-xs font-bold opacity-50 uppercase">
                    {quantity > 1 ? `$${currentPrice} each` : currentOption.name}
                </div>
              </div>
            </div>

            <button 
              onClick={handleAddToCart}
              className={`w-full py-5 rounded-2xl font-bold text-xl text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${THEME.accent} hover:brightness-110`}
            >
              <ShoppingBag className="fill-white/20" />
              {VALENTINE_MODE ? "Add Love to Cart" : "Add to Cart"}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 opacity-60 pb-8">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Zap size={14} /> Fast Shipping
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <Check size={14} /> 3D Printed on Demand
              </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default Order;