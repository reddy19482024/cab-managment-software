const express = require("express");
const dynamicController = require("../controllers/dynamicController");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Load API configurations
const apiConfigPath = path.join(__dirname, "../config/api");
const apiFiles = fs.readdirSync(apiConfigPath);

// Utility function to dynamically add routes based on API configuration
const loadRoutes = () => {
  apiFiles.forEach((file) => {
    const apiDefinition = JSON.parse(fs.readFileSync(path.join(apiConfigPath, file), "utf8"));

    for (const [endpoint, methods] of Object.entries(apiDefinition.paths)) {
      const modelName = getModelNameFromPath(endpoint);
      
      for (const [method, details] of Object.entries(methods)) {
        const operationType = details["x-operation-type"] || null;

        // Set up route based on HTTP method and operation type
        router[method.toLowerCase()](endpoint, (req, res) =>
          dynamicController.handleRequest(req, res, modelName, operationType)
        );
      }
    }
  });
};

// Extract model name from endpoint path (assuming `/modelName/{id}`)
const getModelNameFromPath = (endpoint) => {
  const parts = endpoint.split("/");
  return parts[1]; // assumes `endpoint` is in the form `/modelName/...`
};

// Load routes on startup
loadRoutes();

module.exports = router;
