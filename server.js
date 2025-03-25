require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Vehicle Model
const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
  name: String,
  status: String,
  km: Number,
  oilChangeDue: Number,
  safetyDue: String,
  drivers: [String],
  comment: String
}));

// API Routes
app.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize database with sample data
app.post('/api/init', async (req, res) => {
  try {
    await Vehicle.deleteMany({});
    
    const sampleVehicles = [
      {
        name: "Bus 101",
        status: "on-road",
        km: 125000,
        oilChangeDue: 130000,
        safetyDue: "2024-12-31",
        drivers: ["John Smith", "Mike Johnson"]
      },
      {
        name: "Bus 102",
        status: "in-shop",
        km: 98000,
        oilChangeDue: 100000,
        safetyDue: "2024-11-15",
        drivers: ["Sarah Williams"],
        comment: "Engine maintenance"
      },
      {
        name: "Bus 103",
        status: "out-of-service",
        km: 145000,
        oilChangeDue: 150000,
        safetyDue: "2025-01-20",
        drivers: ["Robert Brown"],
        comment: "Waiting for parts"
      }
    ];
    
    await Vehicle.insertMany(sampleVehicles);
    res.json({ message: "Database initialized", count: sampleVehicles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
