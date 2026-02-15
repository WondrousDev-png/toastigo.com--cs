import React, { useEffect, useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { VALENTINE_MODE, GUMROAD_PRODUCT_URL, CHECKOUT_ENABLED } from '../config';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, CreditCard, ShieldCheck, Sparkles, Lock, MapPin, User, Loader2 } from 'lucide-react';

const Checkout = () => {
  const { cart } = useCart();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // --- FORM STATE ---
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  
  // --- AUTOCOMPLETE STATE ---
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null); 

  const isFormValid = name.trim().length > 0 && address.trim().length > 0;

  const theme = VALENTINE_MODE ? {
      accent: "text-[#D91C5C]",
      bg: "bg-[#FFF0F5]",
      button: "bg-[#D91C5C] hover:bg-[#b0164b] shadow-[#D91C5C]/20",
      buttonDisabled: "bg-gray-300 cursor-not-allowed shadow-none",
      border: "border-[#D91C5C]",
      highlight: "bg-[#FFEDF5]",
      input: "focus:border-[#D91C5C] focus:ring-[#D91C5C]/20"
  } : {
      accent: "text-[#5A3E85]",
      bg: "bg-[#F3E8FF]",
      button: "bg-[#5A3E85] hover:bg-[#462f6b] shadow-[#5A3E85]/20",
      buttonDisabled: "bg-gray-300 cursor-not-allowed shadow-none",
      border: "border-[#5A3E85]",
      highlight: "bg-[#F5F3FF]",
      input: "focus:border-[#5A3E85] focus:ring-[#5A3E85]/20"
  };

  useEffect(() => {
    if (CHECKOUT_ENABLED) {
        if (!document.querySelector('script[src="https://gumroad.com/js/gumroad.js"]')) {
            const script = document.createElement('script');
            script.src = "https://gumroad.com/js/gumroad.js";
            script.async = true;
            script.onload = () => setScriptLoaded(true);
            document.body.appendChild(script);
        } else {
            setScriptLoaded(true);
        }
    }
  }, []);

  // --- FASTER ADDRESS SEARCH (200ms) ---
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (address.length > 2 && showSuggestions) {
            setIsSearching(true);
            try {
                // Using 'us' country code to filter results and make it faster
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=4&countrycodes=us`
                );
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error("Address search failed", error);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSuggestions([]);
        }
    }, 200); // Changed from 500ms to 200ms for snappier feel

    return () => clearTimeout(timer);
  }, [address, showSuggestions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelectAddress = (suggestion) => {
      setAddress(suggestion.display_name);
      setShowSuggestions(false);
      setSuggestions([]);
  };

  // --- CALCULATIONS ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const shipping = subtotal > 50 ? 0 : 5.99; 
  const total = subtotal + shipping;

  // --- FIXED FORMATTING FUNCTION ---
  const buildGumroadLink = () => {
    if (!isFormValid) return '#';

    // 1. Create a clean list with bullet points and line breaks
    const orderItems = cart.map(item => {
      const qty = item.quantity || 1;
      const customText = item.text ? ` (Note: "${item.text}")` : '';
      return `• ${qty}x ${item.name} [${item.variantName}]${customText}`;
    }).join('\n'); // Standard newline

    // 2. Build strings with explicit separation
    // We use a visual separator line "__________" to help Gumroad parse it visually
    const fullOrderDetails = 
`ORDER SUMMARY:
${orderItems}

____________________
Shipping: $${shipping}
Total: $${total.toFixed(2)}`;

    const fullShippingInfo = 
`NAME:
${name}

ADDRESS:
${address}`;

    // 3. Construct URL manually to ensure line breaks stick
    // URLSearchParams is good, but sometimes manual encoding is safer for textareas
    const baseUrl = GUMROAD_PRODUCT_URL;
    const params = new URLSearchParams();
    
    params.append('wanted', 'true');
    params.append('price', total.toFixed(2));
    
    // We send the raw string; URLSearchParams handles the %0A encoding automatically
    params.append('Order Details', fullOrderDetails);
    params.append('Shipping Address', fullShippingInfo);

    return `${baseUrl}?${params.toString()}`;
  };

  if (!CHECKOUT_ENABLED) {
    return (
        <div className={`min-h-[80vh] flex flex-col items-center justify-center text-center p-4 ${theme.bg}`}>
            <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-md">
                <Lock size={64} className={`${theme.accent} opacity-20 mx-auto mb-6`} />
                <h2 className="text-2xl md:text-3xl font-black mb-2">Orders Paused</h2>
                <Link to="/" className={`mt-6 block w-full px-8 py-4 rounded-xl font-bold text-white ${theme.button}`}>Back to Home</Link>
            </div>
        </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className={`min-h-[80vh] flex flex-col items-center justify-center text-center p-4 ${theme.bg}`}>
        <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border-4 border-white w-full max-w-md">
            <ShoppingBag size={64} className={`${theme.accent} opacity-20 mx-auto mb-6`} />
            <h2 className="text-2xl md:text-3xl font-black mb-2">Your cart is empty</h2>
            <Link to="/order" className={`mt-6 block w-full px-8 py-4 rounded-xl font-bold text-white ${theme.button}`}>Start Ordering</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 md:p-12 ${theme.bg}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header - Mobile Friendly Spacing */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-10">
          <Link to="/order" className="self-start group flex items-center gap-2 px-4 py-2 bg-white rounded-full font-bold text-sm hover:shadow-md transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Checkout</h1>
        </div>

        {/* Mobile: Flex-col puts Summary first (order-1), then Receipt (order-2)
            Desktop: Grid puts them side-by-side */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-12">
          
          {/* --- LEFT COLUMN: INFO & ITEMS --- */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6 order-1">
            
            {/* SHIPPING INFO FORM */}
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border-2 border-white/50">
                <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 mb-6">
                    <MapPin className={theme.accent} fill="currentColor" size={20} />
                    Shipping Info
                </h2>
                
                <div className="space-y-4">
                    {/* Name Field */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-2 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" size={20} />
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className={`
                                    w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 font-medium text-gray-700
                                    border-2 border-gray-100 outline-none transition-all
                                    placeholder:text-gray-400 text-base
                                    ${theme.input}
                                `}
                                // text-base forces 16px font on mobile which prevents zooming
                            />
                        </div>
                    </div>

                    {/* Address Field with Autocomplete */}
                    <div ref={wrapperRef} className="relative">
                        <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-2 ml-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 opacity-30" size={20} />
                            
                            {isSearching && (
                                <Loader2 className="absolute right-4 top-4 animate-spin text-gray-400" size={20} />
                            )}

                            <textarea 
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Start typing address (e.g. 123 Main St)..."
                                className={`
                                    w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 font-medium text-gray-700
                                    border-2 border-gray-100 outline-none transition-all
                                    placeholder:text-gray-400 min-h-[100px] resize-none text-base
                                    ${theme.input}
                                `}
                            />
                        </div>

                        {/* Dropdown Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden">
                                {suggestions.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectAddress(item)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 flex items-start gap-3"
                                    >
                                        <MapPin size={16} className="mt-1 opacity-40 shrink-0 text-red-400" />
                                        <span className="text-sm font-medium text-gray-700 line-clamp-2 leading-snug">
                                            {item.display_name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className="text-xs opacity-40 mt-2 ml-1">
                            * Select from list or type manually
                        </p>
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border-2 border-white/50">
              <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 mb-6">
                <Sparkles className={theme.accent} fill="currentColor" size={20} />
                Your Order
              </h2>
              <div className="space-y-3 md:space-y-4">
                {cart.map((item, i) => (
                  <div key={i} className="flex gap-4 items-center p-3 md:p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="w-16 h-16 rounded-xl shadow-sm border-2 border-white shrink-0" style={{backgroundColor: item.color}}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold truncate pr-2">{item.name}</h3>
                        <span className="font-bold whitespace-nowrap">${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                      </div>
                      <p className="text-xs font-bold opacity-40 uppercase">{item.variantName}</p>
                      {item.text && <p className="text-xs opacity-60 mt-1">"{item.text}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN (Receipt) --- */}
          {/* order-2 on mobile puts it at the bottom */}
          <div className="lg:col-span-5 order-2">
            <div className="sticky top-24 bg-white rounded-3xl p-6 md:p-8 shadow-xl border-4 border-white relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-2 ${theme.button}`}></div>
                <h2 className="text-lg font-black mb-6 opacity-40 uppercase tracking-widest text-center">Receipt</h2>
                
                <div className="space-y-2 mb-8">
                    <div className="flex justify-between font-bold text-gray-500 text-sm md:text-base">
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-500 text-sm md:text-base">
                        <span>Shipping</span><span>${shipping.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-4"></div>
                    <div className="flex justify-between items-end">
                        <span className="text-xl font-black">Total</span>
                        <span className={`text-4xl md:text-5xl font-black ${theme.accent}`}>${total.toFixed(2)}</span>
                    </div>
                </div>

                <a 
                    href={buildGumroadLink()}
                    className={`
                        w-full py-4 rounded-xl font-bold text-xl text-white
                        flex justify-center items-center gap-3 
                        transition-all shadow-lg gumroad-button 
                        ${isFormValid ? `${theme.button} hover:opacity-90 active:scale-95` : theme.buttonDisabled}
                    `}
                    onClick={(e) => !isFormValid && e.preventDefault()}
                    target="_blank" 
                    rel="noreferrer"
                >
                   <CreditCard size={24} />
                   {isFormValid ? "Pay Now" : "Enter Details"}
                </a>
                
                {!isFormValid && (
                    <p className="text-center text-xs text-red-400 font-bold mt-3 animate-pulse">
                        Please enter name & address to continue
                    </p>
                )}

                <div className="flex justify-center items-center gap-2 mt-4 opacity-30">
                    <ShieldCheck size={12} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;