require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('ERROR: MONGODB_URI not set in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Routes
app.get('/', (req, res) => {
  res.json({
    status: 'API Running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🔗 Access URL: https://${process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${port}`}`);
});
const cors = require("cors");
app.use(cors({ origin: "https://www.fleetmanagment.free.nf" })); // Replace with your frontend URL



app.get("/vehicles", async (req, res) => {
  const vehicles = await Vehicle.find(); // Always fetches fresh data
  res.json(vehicles);
});
// In server.js
const changeStream = Vehicle.watch();
changeStream.on("change", (change) => {
  io.emit("dataChanged", change); // Send to all clients
});
// In server.js
const vehicleSchema = new mongoose.Schema({
  name: String,
  status: String,
  km: Number,
  oilChangeDue: Number,
  safetyDue: String,
  drivers: [String],
  comment: String
});

// This model will use the "vehicles" collection in Atlas
const Vehicle = mongoose.model("Vehicle", vehicleSchema);
