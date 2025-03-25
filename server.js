require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ["https://www.fleetmanagment.free.nf", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Schema
const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true, enum: ['on-road', 'in-shop', 'out-of-service'] },
  km: { type: Number, required: true, min: 0 },
  oilChangeDue: { type: Number, required: true, min: 0 },
  safetyDue: { type: String, required: true },
  drivers: { type: [String], required: true, validate: [array => array.length > 0, 'At least one driver is required'] },
  comment: { type: String, default: "" }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/fleetmanagement";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: ["https://www.fleetmanagment.free.nf", "http://localhost:3000"],
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

// Get all vehicles
app.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a vehicle
app.put("/vehicles/:id", async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
// Initialization endpoint (protect this in production!)
app.post('/api/init', async (req, res) => {
  try {
    // Delete all existing vehicles
    await Vehicle.deleteMany({});
    
    // Insert new vehicles
    const initialVehicles = [
      {
        name: "Bus 1701",
        status: "on-road",
        km: 12000,
        oilChangeDue: 13000,
        safetyDue: "2023-12-01",
        drivers: ["John Doe", "Jane Smith"],
        comment: ""
      },
      // Add other vehicles as shown above
    ];
    
    const result = await Vehicle.insertMany(initialVehicles);
    res.json({ message: "Database initialized", count: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
