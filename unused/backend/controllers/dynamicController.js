const models = require("../models/dynamicModel");

// Define standard operations with dynamic handling
const operations = {
  getAll: async (model, req, res) => {
    const { page = 1, limit = 10, ...filters } = req.query;
    const skip = (page - 1) * limit;

    const total = await model.countDocuments(filters);
    const data = await model.find(filters).skip(skip).limit(parseInt(limit));

    res.json({
      data,
      pagination: { total, pages: Math.ceil(total / limit), page: parseInt(page), limit: parseInt(limit) },
    });
  },

  getOne: async (model, req, res) => {
    const { id } = req.params;
    const data = await model.findById(id);
    if (!data) return res.status(404).json({ error: "Document not found" });
    res.json(data);
  },

  create: async (model, req, res) => {
    const newDocument = new model(req.body);
    const data = await newDocument.save();
    res.status(201).json(data);
  },

  update: async (model, req, res) => {
    const { id } = req.params;
    const updatedDocument = await model.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedDocument) return res.status(404).json({ error: "Document not found" });
    res.json(updatedDocument);
  },

  delete: async (model, req, res) => {
    const { id } = req.params;
    const deletedDocument = await model.findByIdAndDelete(id);
    if (!deletedDocument) return res.status(404).json({ error: "Document not found" });
    res.status(204).json({ message: "Document deleted successfully" });
  },
};

// Main handler function
exports.handleOperation = async (req, res) => {
  const { modelName, operationType, customFunction } = req.params;
  const model = models[modelName];

  if (!model) return res.status(404).json({ error: "Model not found" });

  // Execute standard CRUD operations
  if (operations[operationType]) {
    return operations[operationType](model, req, res);
  }

  // Handle custom function if specified
  if (customFunction) {
    return await executeCustomFunction(customFunction, req, res);
  }

  res.status(400).json({ error: `Unsupported operation type: ${operationType}` });
};

// Dynamically execute custom functions specified by x-custom-function in OpenAPI
const executeCustomFunction = async (customFunction, req, res) => {
  try {
    // Dynamically import and execute the custom function
    const customFunctionModule = require(`../customFunctions/${customFunction}`);
    await customFunctionModule(req, res);
  } catch (error) {
    res.status(500).json({ error: `Error executing custom function: ${error.message}` });
  }
};
