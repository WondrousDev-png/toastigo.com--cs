import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Upload, Loader } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // <-- NEW IMPORT
import { VALENTINE_MODE } from '../config'; 

// 1. OFFICIAL PINS 
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

  // --- THEME CONFIG ---
  const THEME = VALENTINE_MODE ? {
    bg: "bg-[#FFC5D3]", 
    text: "text-[#8C0E38]", 
    border: "border-[#8C0E38]", 
    cardBg: "bg-white", 
    badge: "bg-[#D91C5C] text-white",
    button: "bg-[#D91C5C] hover:bg-[#8C0E38] text-white"
  } : {
    bg: "bg-[#5ec9ff]", 
    text: "text-[#005fb9]", 
    border: "border-[#005fb9]", 
    cardBg: "bg-white", 
    badge: "bg-[#5A3E85] text-white",
    button: "bg-[#00aaff] hover:bg-[#005fb9] text-white"
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

  // --- NEW: Client-side Image Compression ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1080;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while keeping aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG at 80% quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        sendToServer({ image: compressedBase64, name: file.name });
      };
      
      img.onerror = () => {
        toast.error("Invalid image file.");
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const sendToServer = async (newUpload) => {
    try {
        const res = await fetch('/api/uploads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUpload)
        });
        
        if (!res.ok) throw new Error("Server rejected upload");
        
        toast.success("Sent to the Oven for review!", {
          icon: '🍞',
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
    } catch (error) {
        console.error("Upload Error:", error);
        toast.error("Upload failed. Try a different image.");
    } finally {
        setIsUploading(false);
        // Reset input so user can upload the same file again if it failed
        if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans p-4 md:p-12 transition-colors duration-500 flex flex-col`}>
      <Toaster position="bottom-center" reverseOrder={false} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 md:mb-16 text-center pt-8 relative w-full px-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block mb-2">
            <span className={`px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest border-2 ${THEME.border} bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]`}>
                Global Community
            </span>
        </motion.div>
        
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

      {/* GRID LAYOUT */}
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
            {/* Image Container */}
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