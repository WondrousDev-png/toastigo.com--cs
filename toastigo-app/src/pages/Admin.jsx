import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Lock, Trash2, RefreshCw, ShieldAlert, PackageSearch, Smartphone, Monitor, Globe,
  ShieldCheck, LayoutGrid, BarChart3, MapPin, Link
} from 'lucide-react';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState(false);
  
  const [activeTab, setActiveTab] = useState('products'); 
  const [uploads, setUploads] = useState([]); 
  const [liveItems, setLiveItems] = useState([]); 
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState({ visits: 0, totalOrders: 0, pendingUploads: 0, gallerySize: 0, banned: [], recentTraffic: [] });
  const [loading, setLoading] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: '', hex: '', price: 3.05 });
  const [manualUnbanIp, setManualUnbanIp] = useState("");

  const THEME = {
    bg: "bg-gradient-to-br from-[#5ec9ff] via-[#99dfff] to-[#5ec9ff]", 
    text: "text-[#005fb9]", accent: "bg-[#00aaff]", border: "border-[#005fb9]", 
    button: "bg-[#00aaff] hover:bg-[#004280] text-white shadow-[4px_4px_0px_0px_#005fb9]",
    tabActive: "bg-[#00aaff] text-white border-[#005fb9]", 
    tabInactive: "bg-white/50 text-[#005fb9] hover:bg-white"
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(() => loadData(true), 15000); 
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
        const [uploadRes, galleryRes, analyticsRes, prodRes] = await Promise.all([
            fetch('/api/uploads'), fetch('/api/gallery'), fetch('/api/analytics'), fetch('/api/products')
        ]);
        if (uploadRes.ok) setUploads(await uploadRes.json());
        if (galleryRes.ok) setLiveItems(await galleryRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
        if (!silent) toast.error("Failed to load data");
    } finally {
        if (!silent) setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput.toLowerCase() === "toast") {
      setIsAuthenticated(true); setError(false); toast.success("Welcome back!");
    } else {
      setError(true); toast.error("Incorrect password."); setTimeout(() => setError(false), 2000);
    }
  };

  const getDeviceIcon = (ua) => {
      if(!ua) return <Globe size={14} className="opacity-50"/>;
      const lower = ua.toLowerCase();
      if(lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) return <Smartphone size={14} className="text-blue-500" title={ua} />;
      return <Monitor size={14} className="text-gray-500" title={ua} />;
  };

  const saveProducts = async (updatedProducts) => {
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedProducts) });
      setProducts(updatedProducts); toast.success("Products updated!");
  };

  const handleAddProduct = () => {
      if(!newProduct.name || !newProduct.hex) return toast.error("Name and Hex required.");
      let formattedHex = newProduct.hex.trim();
      if (!formattedHex.startsWith('#')) formattedHex = '#' + formattedHex;
      saveProducts([...products, { id: Date.now().toString(), name: newProduct.name, hex: formattedHex, price: parseFloat(newProduct.price), outOfStock: false }]);
      setNewProduct({ name: '', hex: '', price: 3.05 });
  };

  const handleDeleteProduct = (id) => {
      if(!window.confirm("Delete this color completely?")) return;
      saveProducts(products.filter(p => p.id !== id));
  };

  const handleApprove = async (item) => {
      await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
      await fetch(`/api/uploads/${item.id}`, { method: 'DELETE' });
      toast.success("Added to gallery!"); loadData();
  };

  const handleReject = async (id) => {
      await fetch(`/api/uploads/${id}`, { method: 'DELETE' }); toast.success("Rejected"); loadData();
  };

  const handleBanIP = async (ip) => {
    if(!window.confirm(`Ban ${ip}?`)) return;
    await fetch('/api/ban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip }) });
    toast.success("IP banned."); loadData();
  };

  const handleUnbanIP = async (ip) => {
    if(!ip) return toast.error("Please enter an IP address");
    await fetch('/api/unban', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip }) });
    toast.success(`IP ${ip} unbanned.`); 
    setManualUnbanIp("");
    loadData();
  };

  const handleUnbanAll = async () => {
    if(!window.confirm("Are you sure you want to unban ALL IPs?")) return;
    await fetch('/api/unban-all', { method: 'POST' });
    toast.success("All IPs unbanned."); loadData();
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${THEME.bg} flex items-center justify-center p-4 font-sans`}>
        <Toaster />
        <div className={`w-full max-w-md bg-white rounded-[2rem] border-4 ${THEME.border} shadow-2xl p-8`}>
          <div className={`w-16 h-16 rounded-2xl ${THEME.accent} flex items-center justify-center mb-6 mx-auto`}><Lock className="text-white w-8 h-8" /></div>
          <h2 className={`text-3xl font-black text-center mb-2 ${THEME.text} uppercase`}>Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="ENTER PASSWORD" className={`w-full p-4 rounded-xl border-2 font-mono text-center outline-none ${error ? 'border-red-500 bg-red-50' : `bg-gray-50 focus:${THEME.border}`}`} autoFocus />
            <button type="submit" className={`w-full py-4 rounded-xl font-black uppercase text-lg ${THEME.button}`}>Unlock Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans pb-20`}>
      <Toaster />
      <nav className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b-4 ${THEME.border} px-4 py-3 flex justify-between items-center shadow-sm`}>
         <div className="flex items-center gap-2">
             <div className={`p-2 rounded-lg ${THEME.accent} text-white`}><ShieldCheck size={20} /></div>
             <span className="font-black text-lg hidden sm:block">Toastigo Admin</span>
         </div>
         <button onClick={() => setIsAuthenticated(false)} className="text-sm font-bold opacity-60 hover:opacity-100">LOGOUT</button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6">
            <div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white drop-shadow-md">Dashboard</h2>
                <div className="flex bg-white/50 p-1 rounded-xl border-2 border-white/40 gap-1 flex-wrap backdrop-blur-sm">
                    <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 ${activeTab === 'products' ? THEME.tabActive : THEME.tabInactive}`}><PackageSearch size={16} /> Products</button>
                    <button onClick={() => setActiveTab('queue')} className={`px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 ${activeTab === 'queue' ? THEME.tabActive : THEME.tabInactive}`}>Pending ({uploads.length})</button>
                    <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 ${activeTab === 'live' ? THEME.tabActive : THEME.tabInactive}`}><LayoutGrid size={16} /> Gallery</button>
                    <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-lg font-bold text-sm uppercase flex items-center gap-2 ${activeTab === 'analytics' ? THEME.tabActive : THEME.tabInactive}`}><BarChart3 size={16} /> Tracking</button>
                </div>
            </div>
            <button onClick={() => loadData()} className={`px-4 py-2 rounded-lg bg-white border-2 ${THEME.border} font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50`}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 flex flex-col gap-4">
                    {products.map((p) => (
                        <div key={p.id} className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-4 shadow-lg flex items-center justify-between ${p.outOfStock ? 'opacity-75 bg-gray-50' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl border-2 border-black/20" style={{ backgroundColor: p.hex }}></div>
                                <div><h4 className="font-black text-lg">{p.name}</h4><p className="font-bold opacity-60 text-sm">{p.hex} • ${p.price}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { const u = products.map(x => x.id === p.id ? {...x, outOfStock: !x.outOfStock} : x); saveProducts(u); }} className={`px-4 py-2 rounded-xl font-bold text-xs border-2 ${p.outOfStock ? 'border-red-500 text-red-500' : 'border-green-500 text-green-600'}`}>
                                    {p.outOfStock ? "Sold Out" : "In Stock"}
                                </button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                 </div>
                 <div className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-6 shadow-xl sticky top-24`}>
                     <h3 className="font-black text-2xl mb-4">Add Color</h3>
                     <input type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Color Name" className="w-full p-3 mb-3 border-2 rounded-xl" />
                     <input type="text" value={newProduct.hex} onChange={e => setNewProduct({...newProduct, hex: e.target.value})} placeholder="Hex Code (#FFFFFF)" className="w-full p-3 mb-3 border-2 rounded-xl" />
                     <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="Price" className="w-full p-3 mb-3 border-2 rounded-xl" />
                     <button onClick={handleAddProduct} className={`w-full py-4 rounded-xl font-black ${THEME.button}`}>Add to Store</button>
                 </div>
             </div>
        )}

        {/* --- QUEUE TAB --- */}
        {activeTab === 'queue' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.length === 0 ? <p className="col-span-full text-white font-bold text-center py-10">Queue is empty.</p> : uploads.map((item) => (
                    <div key={item.id} className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-4 shadow-xl flex flex-col`}>
                        <img src={item.imageUrl} alt="Upload" className="w-full aspect-square object-cover bg-gray-100 rounded-xl mb-4 border-2" />
                        <h3 className="font-black text-xl mb-2">{item.name}</h3>
                        
                        <div className="bg-gray-50 p-2 rounded-lg border-2 border-gray-100 mb-4 space-y-1">
                            <p className="text-xs font-mono font-bold">{item.ip}</p>
                            <p className="text-[10px] font-bold uppercase flex items-center gap-1 text-blue-600"><MapPin size={12}/> {item.location}</p>
                            <div className="flex items-center gap-1 text-[10px] font-bold opacity-50 uppercase">{getDeviceIcon(item.device)} {item.device?.substring(0, 30)}...</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            <button onClick={() => handleReject(item.id)} className="py-2 rounded-xl font-bold uppercase text-xs border-2 border-red-500 text-red-500 hover:bg-red-50">Reject</button>
                            <button onClick={() => handleApprove(item)} className={`py-2 rounded-xl font-bold uppercase text-xs ${THEME.button}`}>Approve</button>
                        </div>
                        <button onClick={() => handleBanIP(item.ip)} className="w-full mt-2 py-2 rounded-xl font-bold uppercase text-xs border-2 border-gray-300 text-gray-500 hover:bg-red-500 hover:border-red-500 hover:text-white flex items-center justify-center gap-1"><ShieldAlert size={14}/> Ban IP</button>
                    </div>
                ))}
            </div>
        )}

        {/* --- LIVE GALLERY --- */}
        {activeTab === 'live' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {liveItems.length === 0 ? <p className="col-span-full text-white font-bold text-center py-10">Gallery is empty.</p> : liveItems.map((item) => (
                    <div key={item.id} className={`bg-white rounded-[1.5rem] border-4 ${THEME.border} p-3 shadow-lg relative group`}>
                        <img src={item.imageUrl} alt="Live" className="w-full aspect-square object-cover bg-gray-100 rounded-xl mb-2" />
                        <p className="font-black text-center text-sm">{item.name}</p>
                        <button onClick={() => { fetch(`/api/gallery/${item.id}`, {method: 'DELETE'}); loadData(); }} className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    </div>
                ))}
            </div>
        )}

        {/* --- TRACKING & ANALYTICS --- */}
        {activeTab === 'analytics' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-6`}><p className="font-bold text-xs opacity-60">Total Views</p><p className="text-4xl font-black">{analytics.visits}</p></div>
                    <div className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-6`}><p className="font-bold text-xs opacity-60">Total Gumroad Clicks</p><p className="text-4xl font-black">{analytics.totalOrders}</p></div>
                </div>

                <div className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-6 shadow-xl`}>
                    <h3 className="font-black text-2xl mb-4 flex items-center gap-2"><Globe className="text-blue-500"/> Recent Traffic Log</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead><tr className="border-b-2 opacity-50 uppercase text-xs"><th className="pb-2">Time</th><th className="pb-2">IP Address</th><th className="pb-2">Location</th><th className="pb-2">Source / Referrer</th><th className="pb-2">Device</th></tr></thead>
                            <tbody className="font-bold">
                                {analytics.recentTraffic?.map((log, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 opacity-60 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        <td className="py-3 font-mono">{log.ip}</td>
                                        <td className="py-3 text-blue-600">{log.location}</td>
                                        <td className="py-3 text-xs opacity-70 flex items-center gap-1"><Link size={12}/> {log.source}</td>
                                        <td className="py-3"><div className="flex items-center gap-2">{getDeviceIcon(log.device)} <span className="opacity-50 truncate max-w-[150px]">{log.device}</span></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={`bg-white rounded-[2rem] border-4 ${THEME.border} p-6 shadow-xl`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="font-black text-2xl text-red-500">Banned IPs</h3>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <input 
                                type="text" 
                                value={manualUnbanIp} 
                                onChange={(e) => setManualUnbanIp(e.target.value)} 
                                placeholder="Manually type IP..." 
                                className="px-3 py-2 border-2 rounded-xl text-sm outline-none focus:border-[#005fb9]"
                            />
                            <button onClick={() => handleUnbanIP(manualUnbanIp)} className="px-4 py-2 bg-green-500 text-white font-bold rounded-xl text-sm whitespace-nowrap hover:bg-green-600">Unban</button>
                            {analytics.banned.length > 0 && (
                                <button onClick={handleUnbanAll} className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-xl text-sm whitespace-nowrap">Unban All</button>
                            )}
                        </div>
                    </div>

                    {analytics.banned.length === 0 ? <p className="font-bold opacity-50">No active bans.</p> : (
                        <div className="space-y-2">
                            {analytics.banned.map((b) => (
                                <div key={b.ip} className="flex justify-between p-3 rounded-xl bg-gray-50 border-2 items-center">
                                    <div><p className="font-mono font-bold">{b.ip}</p><p className="text-xs text-blue-500 font-bold">{b.location}</p></div>
                                    <button onClick={() => handleUnbanIP(b.ip)} className="px-3 py-1 bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-bold text-xs rounded-lg">Unban</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
};

export default Admin;