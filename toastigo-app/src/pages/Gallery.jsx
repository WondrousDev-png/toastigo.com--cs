import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Upload, Loader } from 'lucide-react';
import { VALENTINE_MODE } from '../config'; // Controlled strictly by your config file now

// 1. OFFICIAL PINS 
// NOTE: Ensure these are "Direct Links" (ending in .jpg/.png) to avoid pixelation!
const OFFICIAL_PINS = [
  { id: 'off-1', img: "https://i.postimg.cc/FKFHD9SY/toastigopinkeiffel.webp", title: "Eiffel Tower", official: true },
  { id: 'off-2', img: "https://i.postimg.cc/NM1CFwN2/nano-banana-1771124827643.jpg", title: "Gaming Setup", official: true },
  { id: 'off-3', img: "https://i.postimg.cc/6qF8mDXh/nano-banana-1771125166058.jpg", title: "New York City", official: true },
  { id: 'off-4', img: "https://i.postimg.cc/RC218YGG/nano-banana-1771125304650.jpg", title: "Egypt", official: true },
  { id: 'off-5', img: "https://i.postimg.cc/6qZZt9zc/nano-banana-1771125415375.jpg", title: "Bugatti Dealership", official: true },
];

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // --- THEME CONFIG (Strictly from your snippet) ---
  const THEME = VALENTINE_MODE ? {
    bg: "bg-[#FFC5D3]", 
    text: "text-[#8C0E38]", 
    border: "border-[#8C0E38]", 
    cardBg: "bg-white", 
    badge: "bg-[#D91C5C] text-white",
    button: "bg-[#D91C5C] hover:bg-[#8C0E38] text-white"
  } : {
    bg: "bg-[#FDE668]", 
    text: "text-[#5A3E85]", 
    border: "border-[#5A3E85]", 
    cardBg: "bg-white", 
    badge: "bg-[#5A3E85] text-white",
    button: "bg-[#5A3E85] hover:bg-[#3D2A5B] text-white"
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
        const res = await fetch('/api/gallery');
        const data = await res.json();
        setGalleryItems([...data, ...OFFICIAL_PINS]);
    } catch (e) {
        console.log("Using offline/local mode");
        const stored = JSON.parse(localStorage.getItem('toastigo_gallery') || '[]');
        setGalleryItems([...stored, ...OFFICIAL_PINS]);
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newUpload = { image: reader.result, name: file.name };
        try {
            await fetch('/api/uploads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUpload)
            });
            alert("Photo sent to the Oven for review!");
        } catch (error) {
            alert("Upload failed. File might be too big.");
        } finally {
            setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans p-4 md:p-12 transition-colors duration-500 flex flex-col`}>
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 md:mb-16 text-center pt-8 relative w-full px-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block mb-2">
            <span className={`px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest border-2 ${THEME.border} bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]`}>
                Global Community
            </span>
        </motion.div>
        
        {/* Adjusted text size for mobile (text-5xl) vs desktop (text-8xl) */}
        <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter drop-shadow-sm leading-[0.9]">
          In The Wild.
        </h1>
        <p className="text-lg md:text-2xl font-bold opacity-70 max-w-2xl mx-auto leading-tight mb-8 px-4">
          From gaming desks to world travels. See how the world toasts.
        </p>

        {/* Upload Button */}
        <div className="flex justify-center gap-4 mb-8">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className={`px-6 py-3 rounded-full font-bold border-2 border-white/50 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ${THEME.button}`}
            >
                {isUploading ? <Loader className="animate-spin" size={20}/> : <Upload size={20} />}
                {isUploading ? "Uploading..." : "Upload Setup"}
            </button>
        </div>
      </div>

      {/* GRID LAYOUT (Mobile Supported)
          - grid-cols-1: Mobile (1 column)
          - sm:grid-cols-2: Large phones/Small Tablets (2 columns)
          - lg:grid-cols-3: Laptops (3 columns)
          - xl:grid-cols-4: Desktops (4 columns)
      */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
        {galleryItems.map((pin, index) => (
          <motion.div 
            key={pin.id || index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -8, scale: 1.02 }}
            className={`
              relative group rounded-[2rem] overflow-hidden 
              border-4 ${THEME.border} ${THEME.cardBg} shadow-xl transition-all duration-300
              flex flex-col
            `}
          >
            {/* Image Container - 'aspect-square' keeps it perfectly even on all devices */}
            <div className="relative overflow-hidden aspect-square border-b-4 border-inherit">
                <img 
                  src={pin.img || pin.image} 
                  alt={pin.title} 
                  className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                  loading="lazy"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {pin.official && (
                         <span className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md border-2 border-black flex items-center gap-1 shadow-sm">
                            <Star size={10} fill="black" /> OFFICIAL
                         </span>
                    )}
                    {!pin.official && (
                        <span className={`${THEME.badge} text-[10px] font-black px-2 py-1 rounded-md border-2 border-black/10 flex items-center gap-1 shadow-sm`}>
                            <Heart size={10} fill="currentColor" /> FAN
                        </span>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 relative bg-white flex-1 flex flex-col justify-center">
                <h4 className="font-black text-xl leading-none tracking-tight mb-1">{pin.title || "Untitled Masterpiece"}</h4>
                <div className="flex justify-between items-center opacity-60">
                    <span className="text-xs font-bold uppercase tracking-wide">
                        {pin.official ? "Toastigo HQ" : "Verified Owner"}
                    </span>
                    {!pin.official && pin.date && (
                        <span className="text-[10px] font-mono">{pin.date.split(',')[0]}</span>
                    )}
                </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-auto pt-4 text-center pb-8 opacity-40 hover:opacity-100 transition-opacity px-4">
        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            * Images on this website may contain AI-generated elements for artistic purposes.
        </p>
      </div>

    </div>
  );
};

export default Gallery;