require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetmanagement';
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || [
  'https://www.fleetmanagment.free.nf',
  'http://localhost:3000'
];

// Middleware
app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schema
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['on-road', 'in-shop', 'out-of-service'],
    default: 'on-road'
  },
  km: { type: Number, required: true, min: 0 },
  oilChangeDue: { type: Number, required: true, min: 0 },
  safetyDue: { type: Date, required: true },
  drivers: { 
    type: [String], 
    required: true, 
    validate: {
      validator: array => array.length > 0,
      message: 'At least one driver is required'
    }
  },
  comment: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Database Connection
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST']
  }
});

// Real-time Updates
Vehicle.watch().on('change', change => {
  io.emit('vehicle-change', change);
});

// API Routes
app.get('/', (req, res) => {
  res.json({
    status: 'API Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get all vehicles
app.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ name: 1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single vehicle
app.get('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vehicle
app.put('/vehicles/:id', async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    if (!updatedVehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(updatedVehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Initialize database (protected in production)
app.post('/api/init', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await Vehicle.deleteMany({});
    
    const initialVehicles = [
      {
        name: "Bus 101",
        status: "on-road",
        km: 125000,
        oilChangeDue: 130000,
        safetyDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        drivers: ["John Smith", "Mike Johnson"]
      },
      {
        name: "Bus 102",
        status: "on-road",
        km: 98000,
        oilChangeDue: 100000,
        safetyDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        drivers: ["Sarah Williams"]
      },
      {
        name: "Bus 103",
        status: "in-shop",
        km: 145000,
        oilChangeDue: 150000,
        safetyDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        drivers: ["Robert Brown"],
        comment: "Engine maintenance"
      },
      {
        name: "Bus 104",
        status: "out-of-service",
        km: 210000,
        oilChangeDue: 215000,
        safetyDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        drivers: ["Emily Davis"],
        comment: "Waiting for parts"
      }
    ];

    const vehicles = await Vehicle.insertMany(initialVehicles);
    res.json({ message: "Database initialized", count: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
