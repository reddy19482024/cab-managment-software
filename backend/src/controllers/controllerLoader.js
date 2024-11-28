const models = require('../models/modelLoader');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

// Existing utility functions remain the same
const isEndpointDefined = (entityConfig, endpointName) => {
  return entityConfig.endpoints && entityConfig.endpoints[endpointName];
};

const getEndpointByMethod = (entityConfig, method, path) => {
  const endpoints = entityConfig.endpoints;
  return Object.keys(endpoints).find(endpointName => {
    const endpoint = endpoints[endpointName];
    return endpoint.method.toUpperCase() === method.toUpperCase() && 
           endpoint.path === path;
  });
};

const getIdParamName = (path) => {
  const match = path.match(/{(\w+)_id}/);
  return match ? match[1] + "_id" : "id";
};

const createController = (entityName, entityConfig) => {
  const Model = models[entityName];

  const controller = {
    // Existing CRUD operations remain the same
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
          const searchFields = endpoint.params.search.description.split(',').map(field => field.trim());
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
        if (req.query.sort_by) {
          const sortField = req.query.sort_by;
          const sortOrder = req.query.sort_order === 'desc' ? -1 : 1;
          sort[sortField] = sortOrder;
        }

        // Handle pagination
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        const records = await Model.find(filters)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select('-password');

        const total = await Model.countDocuments(filters);
        res.json({
          message: "Records retrieved successfully",
          data: records,
          pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_records: total,
            has_next: page * limit < total,
            has_previous: page > 1
          }
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Updated login handler
    async login(req, res) {
      try {
        const { email, password } = req.body;

        // Find user by email and explicitly select password field
        const user = await Model.findOne({ email: email?.toLowerCase() }).select('+password');
        
        console.log("Login attempt for:", email);
        
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check if user has required fields
        if (!user.password || !user.role) {
          console.error("User data incomplete:", user);
          return res.status(500).json({ message: "User data incomplete" });
        }

        // Basic password validation
        if (user.password !== password) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Get role permissions from constants
        let permissions = [];
        if (entityConfig.constants?.roles && user.role) {
          permissions = entityConfig.constants.roles[user.role]?.permissions || [];
        }

        const token = jwt.sign(
          { 
            id: user._id,
            email: user.email,
            role: user.role,
            permissions
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        // Format response according to the endpoint specification
        res.status(200).json({
          token,
          employee: {
            employee_id: user._id,
            name: user.first_name && user.last_name ? 
                  `${user.first_name} ${user.last_name}` : user.name || user.email,
            role: user.role,
            permissions
          }
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ 
          error: error.message,
          details: "An error occurred during login. Please try again."
        });
      }
    },

    // Updated register handler
    async register(req, res) {
      try {
        // Ensure required fields are present
        const requiredFields = ['email', 'password', 'first_name', 'last_name', 'role'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
          return res.status(400).json({
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
        }

        // Convert email to lowercase
        req.body.email = req.body.email?.toLowerCase();

        // Create new user
        const newRecord = await Model.create(req.body);
        
        // Remove password from response
        const response = newRecord.toObject();
        delete response.password;

        res.status(201).json({
          message: "Registration successful",
          data: response
        });
      } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
          return res.status(400).json({ 
            error: "Email already exists"
          });
        }
        res.status(400).json({ error: error.message });
      }
    }
  };

  // Modified dynamic endpoint handler
  Object.keys(entityConfig.endpoints).forEach(endpointName => {
    if (!controller[endpointName]) {
      controller[endpointName] = async (req, res) => {
        const endpoint = entityConfig.endpoints[endpointName];
        const method = endpoint.method.toUpperCase();
        
        // Handle special cases first
        if (endpointName === 'login') {
          return controller.login(req, res);
        }

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