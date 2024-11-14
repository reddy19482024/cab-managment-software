const models = require('../models/modelLoader');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

// Utility function to check if an endpoint is defined in the JSON config
const isEndpointDefined = (entityConfig, endpointName) => {
  return entityConfig.endpoints && entityConfig.endpoints[endpointName];
};

// Utility function to get endpoint by HTTP method and path
const getEndpointByMethod = (entityConfig, method, path) => {
  const endpoints = entityConfig.endpoints;
  return Object.keys(endpoints).find(endpointName => {
    const endpoint = endpoints[endpointName];
    return endpoint.method.toUpperCase() === method.toUpperCase() && 
           endpoint.path === path;
  });
};

// Utility to get the ID param name from the path
const getIdParamName = (path) => {
  const match = path.match(/{(\w+)_id}/);
  return match ? match[1] + "_id" : "id";
};

const createController = (entityName, entityConfig) => {
  const Model = models[entityName];

  const controller = {
    // Standard CRUD operations
    async create(req, res) {
      try {
        const newRecord = await Model.create(req.body);
        res.status(201).json({
          message: "Record created successfully",
          data: newRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async read(req, res) {
      try {
        const idParamName = Object.keys(req.params)[0];
        let id = req.params[idParamName];

        if (mongoose.Types.ObjectId.isValid(id)) {
          id = mongoose.Types.ObjectId(id);
        }

        const record = await Model.findById(id).select('-password');
        if (!record) {
          return res.status(404).json({ error: 'Record not found' });
        }
        res.json({
          message: "Record retrieved successfully",
          data: record
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async update(req, res) {
      try {
        const idParamName = Object.keys(req.params)[0];
        let id = req.params[idParamName];

        if (mongoose.Types.ObjectId.isValid(id)) {
          id = mongoose.Types.ObjectId(id);
        }

        const updatedRecord = await Model.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        ).select('-password');

        if (!updatedRecord) {
          return res.status(404).json({ error: 'Record not found' });
        }

        res.json({
          message: "Record updated successfully",
          data: updatedRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async delete(req, res) {
      try {
        const idParamName = Object.keys(req.params)[0];
        let id = req.params[idParamName];

        if (mongoose.Types.ObjectId.isValid(id)) {
          id = mongoose.Types.ObjectId(id);
        }

        const deletedRecord = await Model.findByIdAndDelete(id);
        if (!deletedRecord) {
          return res.status(404).json({ error: 'Record not found' });
        }

        res.json({
          message: "Record deleted successfully",
          data: deletedRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async list(req, res) {
      try {
        const endpoint = entityConfig.endpoints.list;
        const filters = {};
        
        // Handle search parameters
        if (endpoint.params?.search && req.query.search) {
          const searchFields = endpoint.params.search.split(',').map(field => field.trim());
          filters.$or = searchFields.map(field => ({
            [field]: { $regex: req.query.search, $options: 'i' }
          }));
        }

        // Handle filter parameters
        if (endpoint.params?.filter) {
          const filterFields = endpoint.params.filter.split(',').map(field => field.trim());
          filterFields.forEach(field => {
            if (req.query[field]) {
              filters[field] = req.query[field];
            }
          });
        }

        // Handle sorting
        let sort = {};
        if (endpoint.params?.sort && req.query.sort) {
          const [field, order] = req.query.sort.split(':');
          if (endpoint.params.sort.includes(field)) {
            sort[field] = order === 'desc' ? -1 : 1;
          }
        }

        const records = await Model.find(filters)
          .sort(sort)
          .select('-password');

        res.json({
          message: "Records retrieved successfully",
          data: records
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Custom operations
    async login(req, res) {
      try {
        const { email, password } = req.body;

        const user = await Model.findOne({ email });
        if (!user || user.password !== password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
        const token = jwt.sign(
          { 
            id: user._id,
            email: user.email,
            role: user.role
          },
          process.env.JWT_SECRET,
          { expiresIn }
        );

        res.status(200).json({
          message: "Login successful",
          token,
          email: user.email
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    async register(req, res) {
      try {
        const newRecord = await Model.create(req.body);
        res.status(201).json({
          message: "Registration successful",
          data: newRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  };

  // Add dynamically named methods based on endpoint names
  Object.keys(entityConfig.endpoints).forEach(endpointName => {
    if (!controller[endpointName]) {
      controller[endpointName] = async (req, res) => {
        const method = entityConfig.endpoints[endpointName].method.toUpperCase();
        
        switch (method) {
          case 'GET':
            if (req.params && Object.keys(req.params).length > 0) {
              return controller.read(req, res);
            }
            return controller.list(req, res);
          case 'POST':
            return controller.create(req, res);
          case 'PUT':
          case 'PATCH':
            return controller.update(req, res);
          case 'DELETE':
            return controller.delete(req, res);
          default:
            return res.status(405).json({ message: "Method not allowed" });
        }
      };
    }
  });

  return controller;
};

module.exports = createController;