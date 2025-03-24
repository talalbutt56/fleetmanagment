require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http'); // Required for WebSocket setup
const { Server } = require('socket.io'); // Modern socket.io import

const app = express();
const server = http.createServer(app); // Create HTTP server for Socket.IO
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "https://www.fleetmanagment.free.nf" })); // Must come before routes
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schema
const vehicleSchema = new mongoose.Schema({
  name: String,
  status: String,
  km: Number,
  oilChangeDue: Number,
  safetyDue: String,
  drivers: [String],
  comment: String
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('ERROR: MONGODB_URI not set');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "https://www.fleetmanagment.free.nf",
    methods: ["GET", "POST"]
  }
});

// Change Stream for Real-Time Updates
Vehicle.watch().on('change', (change) => {
  io.emit('dataChanged', change);
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'API Running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Corrected endpoint (plural)
app.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server (using server.listen instead of app.listen)
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔗 Access URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${port}`}`);
});
