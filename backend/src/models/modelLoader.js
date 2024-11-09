const mongoose = require('mongoose');
const uuid = require('uuid');
const loadConfig = require('../utils/configLoader');

// Load API configurations
const apiConfigs = loadConfig();
const models = {};

// Log the loaded configuration to verify structure
//console.log("Loaded API Configurations:", JSON.stringify(apiConfigs, null, 2));

Object.keys(apiConfigs).forEach(entityFileName => {
  const entityConfigFile = apiConfigs[entityFileName];

  // Extract the actual entity key (e.g., "Driver", "Employee")
  const entityKey = Object.keys(entityConfigFile)[0];
  const entityConfig = entityConfigFile[entityKey];

  // Log each entity's configuration
  //console.log(`\nProcessing entity: "${entityKey}" from file: "${entityFileName}"`);
  //console.log("Entity Config:", JSON.stringify(entityConfig, null, 2));

  if (!entityConfig.endpoints) {
    console.error(`The entity "${entityKey}" is missing the "endpoints" key.`);
    return;
  }

  // Find the first endpoint that has a 'request_payload'
  const endpointWithPayload = Object.values(entityConfig.endpoints).find(
    endpoint => endpoint.request_payload
  );

  if (!endpointWithPayload) {
    console.error(`The entity "${entityKey}" is missing any endpoint with "request_payload".`);
    return;
  }

  const modelConfig = endpointWithPayload.request_payload;
  console.log("Creating schema for model:", entityKey);
  console.log("Model Configuration:", JSON.stringify(modelConfig, null, 2));

  const schemaDefinition = {};

  // Define schema based on request payload and log each field
  Object.keys(modelConfig).forEach(fieldName => {
    const fieldValue = modelConfig[fieldName];

    // Determine field type based on the field value or description in JSON
    let fieldType;
    if (fieldValue === 'UUID') {
      fieldType = { type: String, default: uuid.v4 };
    } else if (fieldValue === 'datetime') {
      fieldType = Date;
    } else if (typeof fieldValue === 'string' && fieldValue === 'string') {
      fieldType = String;
    } else if (typeof fieldValue === 'number') {
      fieldType = Number;
    } else if (Array.isArray(fieldValue)) {
      fieldType = [String]; // Assuming array of strings as default
    } else {
      fieldType = mongoose.Schema.Types.Mixed;
    }

    schemaDefinition[fieldName] = fieldType;
    console.log(`Adding field: ${fieldName}, Type: ${JSON.stringify(fieldType)}`);
  });

  const schema = new mongoose.Schema(schemaDefinition, { timestamps: true });
  models[entityKey] = mongoose.model(entityKey, schema);

  console.log(`Model for "${entityKey}" created successfully.`);
});

module.exports = models;
