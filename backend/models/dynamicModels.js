const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const models = {};

// Load datamodels.json and create dynamic Mongoose models
const datamodelsPath = path.join(__dirname, "../config/datamodels.json");

const loadModels = () => {
  const dataModelsConfig = JSON.parse(fs.readFileSync(datamodelsPath, "utf8"));

  for (const [modelName, modelFields] of Object.entries(dataModelsConfig.models)) {
    const schemaDefinition = buildSchemaDefinition(modelFields);
    models[modelName] = mongoose.model(modelName, new mongoose.Schema(schemaDefinition, { timestamps: true }));
  }
};

// Recursive function to parse nested schema structures and apply defaults
const buildSchemaDefinition = (fields) => {
  const schema = {};

  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    schema[fieldName] = parseFieldConfig(fieldConfig);
  }

  return schema;
};

// Map the JSON configuration to Mongoose field types, including defaults
const parseFieldConfig = (config) => {
  // If config is an array, handle it as an array of subdocuments or fields
  if (Array.isArray(config)) {
    return [parseFieldConfig(config[0])];
  }

  // If it's an object with nested fields, handle it as a subdocument schema
  if (typeof config === "object" && !config.type) {
    return { type: new mongoose.Schema(buildSchemaDefinition(config)) };
  }

  // Process individual field type and options
  let type;
  switch (config.type) {
    case "String":
      type = String;
      break;
    case "Number":
      type = Number;
      break;
    case "Date":
      type = Date;
      break;
    case "ObjectId":
      type = mongoose.Schema.Types.ObjectId;
      break;
    case "Point":
      type = { type: { type: String, default: "Point" }, coordinates: [Number] };
      break;
    default:
      type = String; // Default to string if type is not recognized
  }

  const mongooseOptions = { type };

  // Apply additional options like `required`, `unique`, `enum`, `default`
  for (const [optionKey, optionValue] of Object.entries(config)) {
    if (optionKey !== "type") {
      mongooseOptions[optionKey] = optionValue;
    }
  }

  return mongooseOptions;
};

// Initialize models from datamodels.json
loadModels();

module.exports = models;
