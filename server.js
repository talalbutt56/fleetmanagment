// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000; // Use the environment port or default to 3000

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://username:password@cluster0.mongodb.net/fleet-management?retryWrites=true&w=majority";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Define a simple schema for vehicles
const vehicleSchema = new mongoose.Schema({
  name: String,
  status: String,
  km: Number,
  oilChangeDue: Number,
  safetyDue: String,
  drivers: [String],
  comment: String,
});

// Create a model for vehicles
const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// Routes

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to the Fleet Management API!");
});

// Fetch all vehicles
app.get("/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find(); // Fetch all vehicles from the database
    res.json(vehicles); // Send the vehicles as a JSON response
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

// Add a new vehicle
app.post("/vehicles", async (req, res) => {
  const newVehicle = new Vehicle(req.body); // Create a new vehicle instance

  try {
    await newVehicle.save(); // Save the new vehicle to the database
    res.json(newVehicle); // Send the new vehicle as a JSON response
  } catch (err) {
    res.status(500).json({ error: "Failed to add vehicle" });
  }
});

// Update a vehicle
app.put("/vehicles/:id", async (req, res) => {
  const id = req.params.id; // Get the vehicle ID from the URL
  const updatedVehicle = req.body; // Get the updated vehicle data from the request body

  try {
    await Vehicle.findByIdAndUpdate(id, updatedVehicle); // Update the vehicle in the database
    res.json(updatedVehicle); // Send the updated vehicle as a JSON response
  } catch (err) {
    res.status(500).json({ error: "Failed to update vehicle" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});