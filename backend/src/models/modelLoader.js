const mongoose = require('mongoose');
const uuid = require('uuid');
const loadConfig = require('../utils/configLoader');

// Load API configurations
const apiConfigs = loadConfig();
const models = {};

// Helper function to determine mongoose field type
function getMongooseFieldType(fieldConfig) {
  if (!fieldConfig || !fieldConfig?.type) return mongoose.Schema.Types.Mixed;

  const type = String(fieldConfig.type || "").toLowerCase();
  
  switch (type) {
    case 'uuid':
      return { type: String, default: uuid.v4 };
    case 'string':
      const stringField = { type: String };
      if (fieldConfig.enum) stringField.enum = fieldConfig.enum;
      if (fieldConfig.required) stringField.required = true;
      if (fieldConfig.unique) stringField.unique = true;
      return stringField;
    case 'float':
    case 'integer':
      return { 
        type: Number, 
        required: fieldConfig.required || false 
      };
    case 'datetime':
    case 'date':
    case 'time':
      return { 
        type: Date,
        required: fieldConfig.required || false,
        default: fieldConfig.default === 'CURRENT_TIMESTAMP' ? Date.now : undefined
      };
    case 'boolean':
      return { 
        type: Boolean, 
        default: fieldConfig.default 
      };
    case 'array':
      if (fieldConfig.items && fieldConfig.items.type === 'object') {
        const subSchema = {};
        Object.entries(fieldConfig.items.properties || {}).forEach(([key, value]) => {
          subSchema[key] = getMongooseFieldType(value);
        });
        return [subSchema];
      }
      return [getMongooseFieldType(fieldConfig.items || { type: 'string' })];
    case 'object':
      if (fieldConfig.properties) {
        const objectSchema = {};
        Object.entries(fieldConfig.properties).forEach(([key, value]) => {
          objectSchema[key] = getMongooseFieldType(value);
        });
        return objectSchema;
      }
      return mongoose.Schema.Types.Mixed;
    default:
      return mongoose.Schema.Types.Mixed;
  }
}

// Function to extract fields from endpoints
function extractFieldsFromEndpoints(endpoints, entityConfig) {
  const fields = {};
  
  // Check each endpoint for fields in request_payload and response
  Object.entries(endpoints).forEach(([endpointName, endpoint]) => {
    // Extract from request_payload
    if (endpoint.request_payload) {
      Object.entries(endpoint.request_payload).forEach(([fieldName, fieldConfig]) => {
        if (!fields[fieldName] || (!fields[fieldName].required && fieldConfig.required)) {
          fields[fieldName] = {
            ...fieldConfig,
            // For enums, check if they exist in constants
            enum: fieldConfig.enum && entityConfig.constants ? 
                  getEnumFromConstants(fieldConfig.enum, entityConfig.constants) : 
                  fieldConfig.enum
          };
        }
      });
    }

    // Handle nested response objects
    if (endpoint.response && typeof endpoint.response === 'object') {
      Object.entries(endpoint.response).forEach(([fieldName, fieldValue]) => {
        if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
          Object.entries(fieldValue).forEach(([nestedField, nestedType]) => {
            const fullFieldName = `${fieldName}.${nestedField}`;
            if (!fields[fullFieldName]) {
              fields[fullFieldName] = { type: nestedType };
            }
          });
        } else if (!fields[fieldName] && fieldValue !== 'UUID' && typeof fieldValue === 'string') {
          fields[fieldName] = { type: fieldValue };
        }
      });
    }
  });

  // Add password field for login functionality with proper configuration
  if (endpoints.login) {
    fields.password = { 
      type: 'string',
      required: true,
      select: false // Password won't be returned in queries by default
    };
    
    // Ensure email field has proper configuration for login
    if (!fields.email) {
      fields.email = { 
        type: 'string',
        required: true,
        unique: true,
        lowercase: true, // Ensure email is stored in lowercase
        trim: true // Remove whitespace
      };
    } else {
      fields.email = {
        ...fields.email,
        unique: true,
        lowercase: true,
        trim: true
      };
    }
  }

  return fields;
}

// Helper function to get enum values from constants
function getEnumFromConstants(enumFields, constants) {
  if (Array.isArray(enumFields)) return enumFields;
  
  for (const [groupName, groupConstants] of Object.entries(constants)) {
    if (Array.isArray(groupConstants)) {
      return groupConstants;
    } else if (typeof groupConstants === 'object') {
      return Object.keys(groupConstants);
    }
  }
  return enumFields;
}

// Process each entity in the configuration
Object.keys(apiConfigs).forEach(entityFileName => {
  const entityConfigFile = apiConfigs[entityFileName];
  const entityKey = Object.keys(entityConfigFile)[0];
  const entityConfig = entityConfigFile[entityKey];

  console.log(`Processing model: ${entityKey}`);

  if (!entityConfig.endpoints) {
    console.error(`The entity "${entityKey}" is missing the "endpoints" key.`);
    return;
  }

  // Extract fields from endpoints
  const fields = extractFieldsFromEndpoints(entityConfig.endpoints, entityConfig);
  
  const schemaDefinition = {};

  // Process each field
  Object.entries(fields).forEach(([fieldName, fieldConfig]) => {
    // Handle foreign keys
    if (fieldConfig.foreign_key) {
      const [refModel] = fieldConfig.foreign_key.split('.');
      schemaDefinition[fieldName] = {
        type: mongoose.Schema.Types.ObjectId,
        ref: refModel,
        required: fieldConfig.required || false
      };
    } else {
      schemaDefinition[fieldName] = getMongooseFieldType(fieldConfig);
    }
  });

  // Create schema with timestamps
  const schema = new mongoose.Schema(schemaDefinition, { 
    timestamps: true,
    collection: entityKey.toLowerCase() + 's' // Add 's' for plural collection names
  });

  // Add compound indexes for better query performance
  if (entityKey === 'Employee') {
    schema.index({ email: 1 }, { unique: true });
    schema.index({ employee_code: 1 }, { unique: true });
    schema.index({ status: 1, role: 1 });
    schema.index({ department: 1, status: 1 });
  }

  // Create and store the model
  models[entityKey] = mongoose.model(entityKey, schema);
  console.log(`Model "${entityKey}" created successfully with fields:`, Object.keys(schemaDefinition));
});

module.exports = models;
