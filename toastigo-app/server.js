import express from 'express';
import mqtt from 'mqtt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE FILES ---
const ORDERS_FILE = join(__dirname, 'orders.json');
const UPLOADS_FILE = join(__dirname, 'uploads.json');
const GALLERY_FILE = join(__dirname, 'gallery.json');

// Helper to read JSON safely
const readJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file));
  } catch {
    return [];
  }
};

// Helper to write JSON safely
const writeJSON = (file, data) =>
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

// --- PRINTER STATE & MQTT ---
let printerData = {
  online: false,
  temp: 0,
  state: 'Offline',
  percent: 0,
  lastUpdate: Date.now(),
};

function connectToBambu() {
  const userId = process.env.BAMBU_USER_ID;
  const token = process.env.BAMBU_ACCESS_TOKEN;
  const serial = process.env.PRINTER_SERIAL;

  if (!userId || !token || !serial) {
    console.log("⚠️ Printer credentials missing. Skipping MQTT.");
    return;
  }

  console.log(`📡 Connecting to Printer: ${serial}`);

  const client = mqtt.connect('mqtts://us.mqtt.bambulab.com:8883', {
    username: 'u_' + userId,
    password: token,
    rejectUnauthorized: false,
  });

  client.on('connect', () => {
    console.log('✅ Connected to Bambu Cloud');
    client.subscribe(`device/${serial}/report`);
    client.publish(
      `device/${serial}/request`,
      JSON.stringify({
        pushing: { sequence_id: "0", command: "pushall" },
      })
    );
  });

  client.on('message', (_, message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data?.print) {
        printerData.online = true;
        if (data.print.nozzle_temper !== undefined)
          printerData.temp = data.print.nozzle_temper;
        if (data.print.gcode_state)
          printerData.state = data.print.gcode_state;
        if (data.print.mc_percent !== undefined)
          printerData.percent = data.print.mc_percent;

        printerData.lastUpdate = Date.now();
      }
    } catch {}
  });
}
connectToBambu();

// --- API ROUTES ---
app.get('/api/status', (req, res) => {
  if (Date.now() - printerData.lastUpdate > 45000)
    printerData.online = false;

  res.json(printerData);
});

app.post('/api/orders', (req, res) => {
  const newOrder = {
    ...req.body,
    id: Date.now().toString(),
    date: new Date().toISOString(),
    status: "Pending Payment",
  };

  const orders = readJSON(ORDERS_FILE);
  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);

  res.status(201).json({ success: true, orderId: newOrder.id });
});

app.get('/api/uploads', (_, res) => res.json(readJSON(UPLOADS_FILE)));
app.get('/api/gallery', (_, res) => res.json(readJSON(GALLERY_FILE)));

app.post('/api/uploads', (req, res) => {
  try {
    const uploads = readJSON(UPLOADS_FILE);
    const newUpload = {
      ...req.body,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };

    uploads.push(newUpload);
    writeJSON(UPLOADS_FILE, uploads);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save upload" });
  }
});

app.post('/api/approve', (req, res) => {
  const { id, title } = req.body;

  let uploads = readJSON(UPLOADS_FILE);
  let gallery = readJSON(GALLERY_FILE);

  const index = uploads.findIndex((u) => u.id === id);
  if (index === -1) return res.status(404).json({ error: "Item not found" });

  const item = uploads[index];
  item.title = title || "Community Upload";
  item.approvedAt = new Date().toISOString();

  gallery.unshift(item);
  uploads.splice(index, 1);

  writeJSON(GALLERY_FILE, gallery);
  writeJSON(UPLOADS_FILE, uploads);

  res.json({ success: true });
});

app.post('/api/reject', (req, res) => {
  const { id } = req.body;
  let uploads = readJSON(UPLOADS_FILE);
  uploads = uploads.filter((u) => u.id !== id);
  writeJSON(UPLOADS_FILE, uploads);
  res.json({ success: true });
});

app.post('/api/gallery/delete', (req, res) => {
  const { id } = req.body;
  let gallery = readJSON(GALLERY_FILE);
  gallery = gallery.filter((g) => g.id !== id);
  writeJSON(GALLERY_FILE, gallery);
  res.json({ success: true });
});

/* ======================================================
   STATIC SERVING (FIXED FOR SPA + API)
   ====================================================== */
const distPath = join(__dirname, 'dist');

// 1. Force explicitly correct headers for JS files
app.use(express.static(distPath, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// 2. SPA fallback ONLY for non-API routes AND non-file requests
app.get('*', (req, res, next) => {
  // Ignore API requests
  if (req.path.startsWith('/api')) {
    return next();
  }

  // If the request is for a file extension (.js, .css, etc.) and it got this far, 
  // express.static didn't find it. Return a REAL 404 instead of index.html.
  if (req.path.match(/\.[a-z0-9]+$/i)) {
    return res.status(404).send(`Asset not found: ${req.path}`);
  }

  // Otherwise, serve the single page app index.html
  res.sendFile(join(distPath, 'index.html'));
});

// --- START SERVER ---
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);