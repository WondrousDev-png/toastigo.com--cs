import express from 'express';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE FILES ---
const ORDERS_FILE = join(__dirname, 'orders.json');
const UPLOADS_FILE = join(__dirname, 'uploads.json');
const GALLERY_FILE = join(__dirname, 'gallery.json');
const STATS_FILE = join(__dirname, 'stats.json');
const BANNED_FILE = join(__dirname, 'banned.json'); 
const ANALYTICS_FILE = join(__dirname, 'analytics.json');
const PRODUCTS_FILE = join(__dirname, 'products.json');
const IMG_DIR = join(__dirname, 'public_images');

const DEFAULT_PRODUCTS = [
  { id: 'yellow', name: 'New Yeller Yellow', hex: '#FDE668', price: 3.05, outOfStock: false },
  { id: 'dark',   name: 'Burnt Black',   hex: '#333333', price: 2.45, outOfStock: false }, 
  { id: 'white',  name: 'Institutional White',    hex: '#ffffff', price: 2.45, outOfStock: false }
];

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');
if (!fs.existsSync(UPLOADS_FILE)) fs.writeFileSync(UPLOADS_FILE, '[]');
if (!fs.existsSync(GALLERY_FILE)) fs.writeFileSync(GALLERY_FILE, '[]');
if (!fs.existsSync(BANNED_FILE)) fs.writeFileSync(BANNED_FILE, '[]');
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
if (!fs.existsSync(STATS_FILE)) fs.writeFileSync(STATS_FILE, JSON.stringify({ amountCreated: "30", nextColor: "ORANGE" }));
if (!fs.existsSync(ANALYTICS_FILE)) fs.writeFileSync(ANALYTICS_FILE, JSON.stringify({ visits: 0, trackingLog: [] }));

app.use('/images', express.static(IMG_DIR));

const readJSON = (file, fallback = []) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } 
  catch (e) { return fallback; }
};
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- ROBUST IP EXTRACTION ---
const getClientIP = (req) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.replace('::ffff:', '');
    return ip;
};

const locationCache = {}; 
const fetchLocation = async (ip) => {
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) return "Local Network";
    if (locationCache[ip]) return locationCache[ip];
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await response.json();
        const locString = data.status === 'success' ? `${data.city}, ${data.regionName}, ${data.countryCode}` : "Unknown Location";
        locationCache[ip] = locString;
        return locString;
    } catch (e) { return "Location Unavailable"; }
};

// --- IP BAN MIDDLEWARE ---
app.use((req, res, next) => {
    const bannedIPs = readJSON(BANNED_FILE, []);
    const clientIP = getClientIP(req); 
    
    // Whitelist unban routes
    if (req.path === '/api/unban' || req.path === '/api/unban-all') return next();

    if (bannedIPs.includes(clientIP) && req.method === 'POST') {
        return res.status(403).json({ error: "Your IP has been restricted." });
    }
    next();
});

// --- PRINTER MQTT SETUP ---
let printerData = { online: false, temp: 0, state: 'Offline', percent: 0, lastUpdate: Date.now() };
function connectToBambu() {
    const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100'; 
    const ACCESS_CODE = process.env.PRINTER_ACCESS_CODE || '12345678';
    const SERIAL_NUMBER = process.env.PRINTER_SERIAL || '00M00A000000000';

    const client = mqtt.connect(`mqtts://${PRINTER_IP}:8883`, { username: 'bblp', password: ACCESS_CODE, rejectUnauthorized: false });
    client.on('connect', () => { printerData.online = true; client.subscribe(`device/${SERIAL_NUMBER}/report`); });
    client.on('message', (topic, message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data?.print) {
                printerData.lastUpdate = Date.now();
                printerData.online = true;
                if (data.print.nozzle_temper !== undefined) printerData.temp = data.print.nozzle_temper;
                if (data.print.mc_percent !== undefined) printerData.percent = data.print.mc_percent;
                if (data.print.st_id !== undefined) {
                    const statusMap = { 0: "IDLE", 2: "PREP", 3: "RUNNING", 4: "PAUSED", 5: "DONE" };
                    printerData.state = statusMap[data.print.st_id] || "UNKNOWN";
                }
            }
        } catch (e) {}
    });
    client.on('error', () => { printerData.online = false; printerData.state = 'OFFLINE'; });
}
connectToBambu();
app.get('/api/status', (req, res) => {
  if (Date.now() - printerData.lastUpdate > 45000) printerData.online = false;
  res.json(printerData);
});

// --- TRACKING & ANALYTICS ---
app.post('/api/track', async (req, res) => {
    try {
        let analytics = readJSON(ANALYTICS_FILE);
        
        // Force correct structure if reading an old/broken file
        if (!analytics || typeof analytics !== 'object') analytics = {};
        if (!analytics.visits) analytics.visits = 0;
        if (!Array.isArray(analytics.trackingLog)) analytics.trackingLog = [];

        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'Unknown Device';
        const referrer = req.headers.referer || req.headers.referrer || 'Direct Traffic';
        const location = await fetchLocation(clientIP);

        analytics.visits += 1;
        analytics.trackingLog.unshift({ 
            timestamp: new Date().toISOString(), ip: clientIP, location, device: userAgent, source: referrer 
        });
        
        if (analytics.trackingLog.length > 200) analytics.trackingLog.pop(); 

        writeJSON(ANALYTICS_FILE, analytics);
        res.json({ success: true });
    } catch (err) {
        console.error("Tracking Error:", err);
        res.status(500).json({ error: "Tracking failed" });
    }
});

app.get('/api/analytics', async (_, res) => {
    let analytics = readJSON(ANALYTICS_FILE);
    
    // Force structure here too to prevent .slice() crash
    if (!analytics || typeof analytics !== 'object') analytics = {};
    const safeLog = Array.isArray(analytics.trackingLog) ? analytics.trackingLog : [];
    
    const uploads = readJSON(UPLOADS_FILE, []);
    const gallery = readJSON(GALLERY_FILE, []);
    const bannedIPs = readJSON(BANNED_FILE, []);
    const orders = readJSON(ORDERS_FILE, []); 

    const bannedWithLocations = await Promise.all(bannedIPs.map(async (ip) => ({ ip, location: await fetchLocation(ip) })));

    res.json({
        visits: analytics.visits || 0, 
        totalOrders: orders.length, 
        pendingUploads: uploads.length,
        gallerySize: gallery.length, 
        banned: bannedWithLocations, 
        recentTraffic: safeLog.slice(0, 50) 
    });
});

// --- MODERATION ---
app.post('/api/ban', (req, res) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: "IP required" });
    const banned = readJSON(BANNED_FILE, []);
    if (!banned.includes(ip)) {
        banned.push(ip);
        writeJSON(BANNED_FILE, banned);
    }
    let uploads = readJSON(UPLOADS_FILE, []);
    writeJSON(UPLOADS_FILE, uploads.filter(u => u.ip !== ip));
    res.json({ success: true });
});
app.post('/api/unban', (req, res) => {
    const { ip } = req.body;
    let banned = readJSON(BANNED_FILE, []);
    writeJSON(BANNED_FILE, banned.filter(b => b !== ip));
    res.json({ success: true });
});
app.post('/api/unban-all', (req, res) => {
    writeJSON(BANNED_FILE, []);
    res.json({ success: true });
});

// --- API ENDPOINTS ---
app.get('/api/products', (_, res) => res.json(readJSON(PRODUCTS_FILE)));
app.post('/api/products', (req, res) => { writeJSON(PRODUCTS_FILE, req.body); res.json({ success: true }); });

// Orders kept strictly for your customer frontend to use
app.get('/api/orders', (req, res) => res.json(readJSON(ORDERS_FILE)));
app.post('/api/orders', async (req, res) => {
    const orders = readJSON(ORDERS_FILE);
    const clientIP = getClientIP(req);
    const location = await fetchLocation(clientIP);

    const newOrder = { 
        id: Date.now().toString(), date: new Date().toISOString(), 
        ip: clientIP, location, device: req.headers['user-agent'], ...req.body 
    };
    orders.push(newOrder);
    writeJSON(ORDERS_FILE, orders);
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/uploads', (req, res) => res.json(readJSON(UPLOADS_FILE)));
app.post('/api/uploads', async (req, res) => {
    try {
        if (!req.body.imageBase64) {
            return res.status(400).json({ error: "No imageBase64 data provided. Frontend must send Base64 string." });
        }

        const uploads = readJSON(UPLOADS_FILE);
        const clientIP = getClientIP(req);
        const location = await fetchLocation(clientIP);
        
        const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const match = req.body.imageBase64.match(/^data:image\/(\w+);base64,/);
        const ext = match ? (match[1] === 'jpeg' ? 'jpg' : match[1]) : 'png';
        const filename = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
        
        fs.writeFileSync(join(IMG_DIR, filename), base64Data, 'base64');
        const finalImageUrl = `/images/${filename}`;

        uploads.push({ 
            id: Date.now().toString(), ip: clientIP, location,
            device: req.headers['user-agent'], timestamp: Date.now(), 
            name: req.body.name || 'Anonymous', imageUrl: finalImageUrl 
        });
        writeJSON(UPLOADS_FILE, uploads);
        res.json({ success: true, imageUrl: finalImageUrl });
    } catch (error) { res.status(500).json({ error: "Failed to save image" }); }
});

app.delete('/api/uploads/:id', (req, res) => {
    let uploads = readJSON(UPLOADS_FILE);
    uploads = uploads.filter(u => u.id !== req.params.id);
    writeJSON(UPLOADS_FILE, uploads);
    res.json({ success: true });
});

app.get('/api/gallery', (req, res) => res.json(readJSON(GALLERY_FILE)));
app.post('/api/gallery', (req, res) => {
    const gallery = readJSON(GALLERY_FILE);
    gallery.push(req.body);
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true });
});
app.delete('/api/gallery/:id', (req, res) => {
    let gallery = readJSON(GALLERY_FILE);
    gallery = gallery.filter(g => g.id !== req.params.id);
    writeJSON(GALLERY_FILE, gallery);
    res.json({ success: true });
});

const distPath = join(__dirname, 'dist');
app.use('/assets', express.static(join(distPath, 'assets')));
app.use(express.static(distPath));
app.get(/^(?!\/api).*/, (req, res) => { res.sendFile(join(distPath, 'index.html')); });

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));