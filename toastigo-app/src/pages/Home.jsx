import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; 
import { 
  Heart, ArrowRight, Upload, CheckCircle, Package, Activity, Star, Thermometer, ShoppingBag
} from 'lucide-react';

// --- CONFIG IMPORT ---
// Defaults to true if config is missing to prevent crashes
import { VALENTINE_MODE as CONFIG_MODE } from '../config';
const VALENTINE_MODE = CONFIG_MODE !== undefined ? CONFIG_MODE : true;

/* --- CUSTOMIZE IMAGES --- */
const IMAGE_CONFIG = {
  heroProduct: VALENTINE_MODE 
    ? "https://i.postimg.cc/GppLndjq/toastigopinkicon.png" 
    : "https://i.postimg.cc/tgsKzTkj/toastigowhiteicon.png", 
  gallery: [
    "https://i.postimg.cc/SKYWQ7ZW/toastigoblack.png",
    "https://i.postimg.cc/fyDXK4Mv/toastigoorange.png",
    "https://i.postimg.cc/QCm7Y6tX/toastigowhite.png",
    "https://i.postimg.cc/jd92qVBp/wmremove-transformed.png"
  ]
};

/* --- THEME CONFIG --- */
const THEME = VALENTINE_MODE ? {
  mode: 'valentine',
  bgGradient: "bg-gradient-to-br from-[#FFC5D3] via-[#FFD0E0] to-[#FFC5D3]",
  text: "text-[#8C0E38]",
  accent: "text-[#8C0E38]",
  border: "border-[#8C0E38]",
  cardBg: "bg-white/90 backdrop-blur-md",
  button: "bg-[#D91C5C] hover:bg-[#8C0E38] text-white shadow-[4px_4px_0px_0px_#8C0E38]",
  highlight: "bg-[#FFEAEE]",
  icon: <Heart className="w-full h-full fill-[#D91C5C] text-[#D91C5C] animate-pulse" />
} : {
  mode: 'toast',
  bgGradient: "bg-gradient-to-br from-[#5ec9ff] via-[#99dfff] to-[#5ec9ff]",
  text: "text-[#005fb9]",
  accent: "text-[#005fb9]",
  border: "border-[#005fb9]",
  cardBg: "bg-white/80 backdrop-blur-md",
  button: "bg-[#00aaff] hover:bg-[#004280] text-white shadow-[4px_4px_0px_0px_#005fb9]",
  highlight: "bg-[#FFFF]",
  icon: <div className="w-full h-full rounded-full border-[8px] border-[#005fb9] bg-white"></div>
};

/* --- ANIMATION VARIANTS --- */
const containerVar = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }};
const itemVar = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }};
const floatVar = { animate: { y: [0, -15, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }};

/* --- COMPONENTS --- */
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&display=swap');
    .font-bubbly { font-family: 'Fredoka', sans-serif; }
    .text-stroke-thick { -webkit-text-stroke: 1.5px ${VALENTINE_MODE ? '#8C0E38' : '#5A3E85'}; paint-order: stroke fill; }
    @media (min-width: 768px) { .text-stroke-thick { -webkit-text-stroke: 3px ${VALENTINE_MODE ? '#8C0E38' : '#5A3E85'}; } }
  `}</style>
);

const Marquee = () => {
  const content = "USE DISCOUNT CODE RELEASE • FREE SHIPPING ON 3+ ITEMS • 3D PRINTED FRESH WEEKLY • BUY A TOASTIGO • ";
  return (
    <div className={`w-full py-2 md:py-3 overflow-hidden border-y-4 ${THEME.border} bg-white relative z-20 flex`}>
      <motion.div 
        className={`flex whitespace-nowrap font-black text-sm md:text-lg tracking-widest ${THEME.text}`}
        animate={{ x: "-50%" }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        style={{ width: "fit-content" }} 
      >
        <span className="mr-4">{content} {content} {content}</span>
        <span className="mr-4">{content} {content} {content}</span>
      </motion.div>
    </div>
  );
};

const OvenDashboard = () => {
  const [status, setStatus] = useState({ online: false, temp: 0, percent: 0, state: "CONNECTING..." });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setStatus(data.online ? data : { ...data, state: "OFFLINE", temp: 0 });
      } catch (e) {
        setStatus(prev => ({ ...prev, online: false, state: "CONNECTION ERROR" }));
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); 
    return () => clearInterval(interval);
  }, []);

  const tempF = Math.round((status.temp * 9/5) + 32);

  return (
    <motion.div variants={itemVar} className={`relative overflow-hidden rounded-[2rem] md:rounded-[3rem] border-4 ${THEME.border} ${THEME.cardBg} p-5 md:p-8 shadow-xl`}>
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`p-3 md:p-4 rounded-2xl border-2 ${THEME.border} bg-white shrink-0`}>
            <Activity className={`w-6 h-6 md:w-8 md:h-8 ${THEME.accent} ${status.online ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl md:text-3xl font-black uppercase ${THEME.text} leading-none`}>The Oven</h2>
            <div className="flex items-center gap-2 mt-1">
              {status.online ? (
                <>
                  <span className="relative flex h-2 w-2 md:h-3 md:w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span></span>
                  <p className={`font-bold text-xs md:text-sm ${THEME.accent}`}>LIVE STATUS</p>
                </>
              ) : <p className="font-bold text-sm text-gray-400">PRINTER OFFLINE</p>}
            </div>
          </div>
          {/* Mobile Temp Badge */}
          <div className={`md:hidden px-3 py-1 rounded-lg border-2 ${THEME.border} bg-white font-bold text-sm flex items-center gap-1`}>
             <Thermometer size={14}/> {status.online ? `${tempF}°` : "--"}
          </div>
        </div>
        {/* Desktop Temp Badge */}
        <div className={`hidden md:flex px-4 py-2 rounded-xl border-2 ${THEME.border} bg-white font-bold text-xl items-center gap-2 min-w-[120px] justify-center`}>
          <Thermometer size={18}/> {status.online ? `${tempF}°F` : "--"}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className={`w-full h-8 md:h-12 border-4 ${THEME.border} rounded-full bg-white relative overflow-hidden shadow-inner`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${status.percent}%` }} transition={{ duration: 0.5 }} className={`h-full ${THEME.mode === 'valentine' ? 'bg-[#D91C5C]' : 'bg-[#5A3E85]'}`} />
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] mix-blend-overlay"></div>
      </div>
      <div className={`flex flex-col sm:flex-row justify-between mt-3 font-bold ${THEME.text} uppercase text-xs md:text-sm gap-1`}>
        <span>Job: {status.state}</span>
        <span>{Math.round(status.percent)}% Complete</span>
      </div>
    </motion.div>
  );
};

/* --- MAIN PAGE --- */
const Home = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

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
            setIsUploading(false);
            setUploadStatus('success');
            setTimeout(() => setUploadStatus(null), 3000);
        } catch (error) {
            console.error("Upload failed", error);
            setIsUploading(false);
            alert("Failed to upload. Image might be too large!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`min-h-screen ${THEME.bgGradient} ${THEME.text} font-bubbly overflow-x-hidden selection:bg-white selection:text-[#D91C5C]`}>
      <FontStyles />
      
      {/* Navbar */}
      <nav className={`flex justify-between items-center p-4 md:p-6 max-w-7xl mx-auto`}>
        <div className="font-black text-2xl md:text-3xl tracking-tighter cursor-pointer hover:scale-105 transition-transform">toastigo.</div>
        <Link to="/order" className={`px-4 py-2 md:px-6 md:py-2 rounded-full font-bold border-2 ${THEME.border} bg-white hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0 active:shadow-none flex items-center gap-2 text-sm md:text-base`}>
          <ShoppingBag size={18} /> Order
        </Link>
      </nav>

      <Marquee />

      {/* Hero Section */}
      <motion.div variants={containerVar} initial="hidden" animate="visible" className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
        
        {/* Text Area */}
        <motion.div variants={itemVar} className="text-center lg:text-left z-10 flex flex-col items-center lg:items-start order-2 lg:order-1">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`inline-block mb-4 px-3 py-1 md:px-4 md:py-2 rounded-full bg-white border-2 ${THEME.border} font-bold text-xs md:text-sm uppercase tracking-wide shadow-sm`}>
            {VALENTINE_MODE ? "💘 Cupid Approved" : "✨ Limited Edition!"}
          </motion.div>
          
          {/* Responsive Typography Fix */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.9] mb-6 md:mb-8 tracking-tighter drop-shadow-sm">
            {VALENTINE_MODE ? "LOVE." : "TOAST."} <br/>
            <span className="text-white text-stroke-thick relative inline-block">{VALENTINE_MODE ? "TOAST." : "LITERALLY."}</span>
          </h1>
          
          <p className="text-lg md:text-2xl font-bold mb-8 md:mb-10 opacity-80 max-w-lg mx-auto lg:mx-0 leading-relaxed px-2 lg:px-0">
            {VALENTINE_MODE ? "Forget the flowers. Get them something that lasts longer than a week." : "The ultimate desk accessory. 3D printed with precision, packed with personality."}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/order" className={`w-full sm:w-auto px-10 py-4 md:py-5 rounded-2xl text-lg md:text-xl font-bold border-2 border-transparent flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 ${THEME.button}`}>
              Get Yours <ArrowRight strokeWidth={3} />
            </Link>
          </div>
        </motion.div>

        {/* Floating Product Image */}
        <motion.div variants={floatVar} animate="animate" className="relative order-1 lg:order-2 w-full max-w-sm mx-auto lg:max-w-full">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] rounded-full blur-3xl opacity-40 bg-white`}></div>
          <motion.div whileHover={{ rotate: 5, scale: 1.05 }} className={`relative bg-white border-4 ${THEME.border} rounded-[2.5rem] p-4 md:p-6 shadow-2xl z-10 rotate-[-3deg] lg:rotate-[-6deg]`}>
            <div className={`aspect-square rounded-[2rem] ${THEME.highlight} flex items-center justify-center mb-4 md:mb-6 overflow-hidden relative border-2 ${THEME.border}`}>
               {IMAGE_CONFIG.heroProduct ? <img src={IMAGE_CONFIG.heroProduct} alt="Toastigo Product" loading="eager" className="w-full h-full object-cover" /> : <div className="w-48 h-48">{THEME.icon}</div>}
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className={`absolute top-4 right-4 bg-[#FFD700] text-black px-3 py-1 md:px-4 md:py-2 rounded-full font-black text-lg md:text-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-12`}>
                ${VALENTINE_MODE ? "3.05" : "2.45"}
              </motion.div>
            </div>
            <div className="flex justify-between items-end">
              <div><h3 className={`text-2xl md:text-3xl font-black leading-none ${THEME.text}`}>Toastigo</h3><p className="font-bold opacity-50 mt-1 text-sm md:text-base">1 OF 1 SERIAL NUMBER</p></div>
              <div className="flex gap-1 text-yellow-400 drop-shadow-sm">{[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-current stroke-black stroke-1" />)}</div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 mb-20 md:mb-32">
        <OvenDashboard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          {[
            { label: "Toastigo's Created", val: "30", icon: <Package /> },
            { label: "Next Color", val: "ORANGE", icon: <CheckCircle /> },
            { label: "Avg. Rating", val: "5/5", icon: <Star /> },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ y: -5 }} className={`bg-white/80 p-5 rounded-[2rem] border-2 ${THEME.border} flex items-center gap-4 shadow-sm`}>
              <div className={`p-3 rounded-full ${THEME.highlight} border-2 ${THEME.border}`}>{React.cloneElement(stat.icon, { size: 20 })}</div>
              <div><h4 className={`text-2xl font-black ${THEME.text}`}>{stat.val}</h4><p className="font-bold opacity-60 text-xs md:text-sm uppercase">{stat.label}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="px-4 md:px-6 pb-20 md:pb-32">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-sm">Freshly Baked.</h2>
          <p className="text-lg md:text-xl font-bold opacity-70">Join the hall of fame. Upload your setup.</p>
        </div>

        {/* Gallery Grid - Responsive Columns */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {IMAGE_CONFIG.gallery.map((imgSrc, index) => (
            <motion.div key={index} whileHover={{ scale: 1.05, rotate: (index % 2 === 0 ? 2 : -2) }} className={`aspect-square rounded-2xl md:rounded-[2rem] border-4 ${THEME.border} bg-white overflow-hidden relative group cursor-pointer shadow-lg`}>
              <img src={imgSrc} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={`Community Upload ${index + 1}`} loading="lazy"/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg border-2 bg-white ${THEME.border} ${THEME.text} hover:scale-105 active:scale-95 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] inline-flex justify-center items-center gap-2`}
          >
            {isUploading ? "Sending to Oven..." : uploadStatus === 'success' ? "Sent to Review!" : <><Upload size={20} /> Upload Your Photo</>}
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;