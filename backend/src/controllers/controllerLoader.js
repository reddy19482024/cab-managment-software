const models = require('../models/modelLoader');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

// Utility function to check if an endpoint is defined in the JSON config
const isEndpointDefined = (entityConfig, action) => {
  return entityConfig.endpoints && entityConfig.endpoints[action];
};

const createController = (entityName, entityConfig) => {
  const Model = models[entityName];

  // Utility to get the ID param name from the JSON config dynamically
  const getIdParamName = (action) => {
    const endpointPath = entityConfig.endpoints[action].path;
    return endpointPath.match(/{(\w+)_id}/)?.[1] + "_id" || "id";
  };

  return {
    async create(req, res) {
      if (isEndpointDefined(entityConfig, 'create')) {
        try {
          const newRecord = await Model.create(req.body);
          res.status(201).json({ message: "Record created successfully", data: newRecord });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    async read(req, res) {
      if (isEndpointDefined(entityConfig, 'read')) {
        try {
          const idParamName = getIdParamName('read');
          let id = req.params[idParamName];

          if (mongoose.Types.ObjectId.isValid(id)) {
            id = mongoose.Types.ObjectId(id);
          }

          const record = await Model.findById(id).select('-password'); // Exclude sensitive fields
          if (!record) return res.status(404).json({ error: 'Record not found' });
          res.json({ message: "Record retrieved successfully", data: record });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    async update(req, res) {
      if (isEndpointDefined(entityConfig, 'update')) {
        try {
          const idParamName = getIdParamName('update');
          let id = req.params[idParamName];

          if (mongoose.Types.ObjectId.isValid(id)) {
            id = mongoose.Types.ObjectId(id);
          }

          const updatedRecord = await Model.findByIdAndUpdate(id, req.body, { new: true }).select('-password');
          if (!updatedRecord) return res.status(404).json({ error: 'Record not found' });
          res.json({ message: "Record updated successfully", data: updatedRecord });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    async delete(req, res) {
      if (isEndpointDefined(entityConfig, 'delete')) {
        try {
          const idParamName = getIdParamName('delete');
          let id = req.params[idParamName];

          if (mongoose.Types.ObjectId.isValid(id)) {
            id = mongoose.Types.ObjectId(id);
          }

          const deletedRecord = await Model.findByIdAndDelete(id);
          if (!deletedRecord) return res.status(404).json({ error: 'Record not found' });
          res.json({ message: "Record deleted successfully", data: deletedRecord });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    async list(req, res) {
      if (isEndpointDefined(entityConfig, 'list')) {
        try {
          const filters = req.query || {};
          const records = await Model.find(filters).select('-password'); // Exclude sensitive fields
          res.json({ message: "Records retrieved successfully", data: records });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    // Custom Endpoint: Register - Save to DB
    async register(req, res) {
      if (isEndpointDefined(entityConfig, 'register')) {
        try {
          const newRecord = await Model.create(req.body);
          res.status(201).json({ message: "Registration successful", data: newRecord });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    // Custom Endpoint: Request OTP
    async requestOtp(req, res) {
      if (isEndpointDefined(entityConfig, 'requestOtp')) {
        res.status(200).json({
          message: "OTP has been sent to your mobile number.",
          receivedData: req.body
        });
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    },

    // Login with JWT Authentication
    async login(req, res) {
      if (isEndpointDefined(entityConfig, 'login')) {
        try {
          const { email, password } = req.body;

          const employee = await Model.findOne({ email });
          if (!employee || employee.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
          }

          const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
          const token = jwt.sign(
            { employee_id: employee._id, email: employee.email, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn }
          );

          res.status(200).json({ message: "Login successful", token, email });
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(501).json({ message: "Implementation is pending for login" });
      }
    },

    // Custom Endpoint: Verify OTP
    async verifyOtp(req, res) {
      if (isEndpointDefined(entityConfig, 'verifyOtp')) {
        res.status(200).json({
          message: "OTP verified successfully. Returning token.",
          token: "jwt-token-for-authentication"
        });
      } else {
        res.status(404).json({ message: "Endpoint not found" });
      }
    }
  };
};

module.exports = createController;
