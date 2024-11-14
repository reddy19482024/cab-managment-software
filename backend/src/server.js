require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const createRoutes = require('./routes/routeLoader');
const cors = require('cors');  // Import cors

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());  // Enable CORS for all origins
app.use(bodyParser.json());

// Load dynamic routes
app.use(createRoutes());

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
