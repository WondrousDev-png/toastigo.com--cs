import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Trash2, Check, RefreshCw, 
  ShieldCheck, Image as ImageIcon, Edit3, Layers, LayoutGrid
} from 'lucide-react';

const VALENTINE_MODE = true; 

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);
  
  // Data State
  const [activeTab, setActiveTab] = useState('queue'); 
  const [uploads, setUploads] = useState([]); 
  const [liveItems, setLiveItems] = useState([]); 
  const [draftTitles, setDraftTitles] = useState({});
  const [loading, setLoading] = useState(false);

  const THEME = VALENTINE_MODE ? {
    bg: "bg-[#FFC5D3]", text: "text-[#8C0E38]", accent: "bg-[#D91C5C]", 
    border: "border-[#8C0E38]", button: "bg-[#D91C5C] text-white shadow-[#8C0E38]",
    tabActive: "bg-[#D91C5C] text-white", tabInactive: "bg-white/50 text-[#8C0E38]"
  } : {
    bg: "bg-[#FDE668]", text: "text-[#5A3E85]", accent: "bg-[#5A3E85]", 
    border: "border-[#5A3E85]", button: "bg-[#5A3E85] text-white shadow-[#5A3E85]",
    tabActive: "bg-[#5A3E85] text-white", tabInactive: "bg-white/50 text-[#5A3E85]"
  };

  // --- AUTO REFRESH & LOAD DATA ---
  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        loadData(true); // true = silent refresh (no loading spinner)
      }, 10000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
        const uploadRes = await fetch('/api/uploads');
        const galleryRes = await fetch('/api/gallery');
        
        if (uploadRes.ok) setUploads(await uploadRes.json());
        if (galleryRes.ok) setLiveItems(await galleryRes.json());
    } catch (err) {
        console.error("Failed to load admin data");
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === "toast") {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  // --- SERVER ACTIONS ---

  const handleApprove = async (id) => {
    const title = draftTitles[id] || "Community Setup";
    
    // Send to Server
    await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title })
    });

    // Refresh Local State immediately
    loadData();
    alert("Approved!");
  };

  const handleReject = async (id) => {
    await fetch('/api/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    loadData();
  };

  const handleDeleteLive = async (id) => {
    if(!window.confirm("Delete permanently?")) return;
    
    await fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    loadData();
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans flex items-center justify-center p-6`}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`w-full max-w-md bg-white/90 backdrop-blur-md rounded-[2rem] border-4 ${THEME.border} p-8 shadow-2xl`}
        >
          <div className="flex flex-col items-center mb-6">
            <div className={`p-4 rounded-full ${THEME.accent} text-white mb-4 shadow-lg`}>
              <Lock size={32} strokeWidth={3} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-center">Admin Panel</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="PASSWORD"
              className={`w-full p-4 text-center text-lg font-black rounded-xl border-4 outline-none ${THEME.border} bg-white`}
              autoFocus
            />
            {error && <p className="text-center text-red-500 font-bold animate-pulse">WRONG PASSWORD</p>}
            <button type="submit" className={`w-full py-4 rounded-xl font-bold text-lg uppercase shadow-lg ${THEME.button}`}>Unlock</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans pb-20`}>
      <nav className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 ${THEME.border} px-4 py-3 flex justify-between items-center shadow-sm`}>
         <div className="flex items-center gap-2">
             <div className={`p-2 rounded-lg ${THEME.accent} text-white`}><ShieldCheck size={20} /></div>
             <span className="font-black text-lg leading-none hidden sm:block">Toastigo Admin</span>
         </div>
         <div className="flex items-center gap-4">
            {loading && <RefreshCw size={20} className="animate-spin opacity-50" />}
            <button onClick={() => setIsAuthenticated(false)} className="text-sm font-bold opacity-60 hover:opacity-100">LOGOUT</button>
         </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Dashboard</h2>
                <div className="flex bg-white/50 p-1 rounded-xl border-2 border-black/5 gap-1 inline-flex">
                    <button onClick={() => setActiveTab('queue')} className={`px-6 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 transition-all ${activeTab === 'queue' ? THEME.tabActive : THEME.tabInactive}`}>
                        <Layers size={16} /> Pending ({uploads.length})
                    </button>
                    <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 transition-all ${activeTab === 'live' ? THEME.tabActive : THEME.tabInactive}`}>
                        <LayoutGrid size={16} /> Gallery ({liveItems.length})
                    </button>
                </div>
            </div>
            <button onClick={() => loadData()} className={`px-4 py-2 rounded-lg bg-white border-2 ${THEME.border} font-bold flex items-center gap-2`}>
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
        </div>

        {activeTab === 'queue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.map((upload) => (
                    <motion.div layout key={upload.id} className={`bg-white rounded-[2rem] border-4 ${THEME.border} overflow-hidden shadow-xl flex flex-col`}>
                        <div className="aspect-square relative bg-gray-100">
                            <img src={upload.image} alt="Upload" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <input 
                                type="text" 
                                placeholder="Title..."
                                onChange={(e) => setDraftTitles({...draftTitles, [upload.id]: e.target.value})}
                                className={`w-full p-3 rounded-xl border-2 bg-gray-50 text-sm font-bold ${THEME.border}`}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleReject(upload.id)} className="py-3 rounded-xl border-2 border-gray-200 font-bold text-xs uppercase hover:bg-red-50">Reject</button>
                                <button onClick={() => handleApprove(upload.id)} className={`py-3 rounded-xl text-white font-bold text-xs uppercase ${THEME.button}`}>Approve</button>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {uploads.length === 0 && <div className="col-span-full text-center py-20 font-bold opacity-50">No pending uploads.</div>}
            </div>
        )}

        {activeTab === 'live' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {liveItems.map((item) => (
                    <motion.div layout key={item.id} className={`group relative bg-white rounded-2xl border-2 ${THEME.border} overflow-hidden`}>
                        <img src={item.image} className="w-full aspect-square object-cover" />
                        <button 
                            onClick={() => handleDeleteLive(item.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div className="p-3">
                            <p className="font-bold text-xs truncate">{item.title}</p>
                        </div>
                    </motion.div>
                ))}
                 {liveItems.length === 0 && <div className="col-span-full text-center py-20 font-bold opacity-50">Gallery is empty.</div>}
            </div>
        )}

      </main>
    </div>
  );
};

export default Admin;