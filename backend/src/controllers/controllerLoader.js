const models = require('../models/modelLoader');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const sharp = require('sharp'); // For image processing

// Utility functions
const isEndpointDefined = (entityConfig, endpointName) => {
  return entityConfig.endpoints && entityConfig.endpoints[endpointName];
};

const getEndpointByMethod = (entityConfig, method, path) => {
  const endpoints = entityConfig.endpoints;
  return Object.keys(endpoints).find(endpointName => {
    const endpoint = endpoints[endpointName];
    return endpoint.method.toUpperCase() === method.toUpperCase() && endpoint.path === path;
  });
};

const getIdParamName = (path) => {
  const match = path.match(/{(\w+)_id}/);
  return match ? match[1] + "_id" : "id";
};
const isImageModel = (entityName) => {
  return entityName.toLowerCase().includes('image');
};

const isDocumentModel = (entityName) => {
  return entityName.toLowerCase().includes('document');
};

const createController = (entityName, entityConfig) => {
  const Model = models[entityName];
  const isImage = isImageModel(entityName);
  const isDocument = isDocumentModel(entityName);

  const controller = {
    // Special handler for file uploads
    async upload(req, res) {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileNameWithoutExt = req.file.filename.substring(0, req.file.filename.lastIndexOf('.'));
        const fileExt = req.file.filename.split('.').pop();

        let fileData = {
          ...req.body,
          file_url: req.file.path,
          file_type: req.file.mimetype.split('/')[1],
          uploaded_by: req.user.id,
          status: 'active'  // Set default status as active for new uploads
        };

        if (isImage) {
          // Process image and create thumbnails
          const imageInfo = await sharp(req.file.path).metadata();
          const thumbnails = await Promise.all([
            sharp(req.file.path)
              .resize(50, 50, { fit: 'cover' })
              .toFile(`${req.file.destination}${fileNameWithoutExt}-small.${fileExt}`),
            sharp(req.file.path)
              .resize(150, 150, { fit: 'cover' })
              .toFile(`${req.file.destination}${fileNameWithoutExt}-medium.${fileExt}`)
          ]);

          fileData = {
            ...fileData,
            original_url: req.file.path,
            thumbnail_urls: {
              small: `uploads/images/${fileNameWithoutExt}-small.${fileExt}`,
              medium: `uploads/images/${fileNameWithoutExt}-medium.${fileExt}`
            },
            dimensions: {
              width: imageInfo.width,
              height: imageInfo.height
            },
            status: 'active'  // Ensure status is set for image uploads
          };
        }

        if (isDocument) {
          // Add document specific fields
          fileData = {
            ...fileData,
            verification_status: 'pending',
            document_metadata: {
              ...req.body.document_metadata,
              document_number: req.body.document_number,
              issuing_authority: req.body.issuing_authority,
              issue_date: req.body.issue_date,
              expiry_date: req.body.expiry_date
            }
          };
        }

        const newRecord = await Model.create(fileData);

        res.status(201).json({
          message: "File uploaded successfully",
          data: newRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Override create for special handling
    async create(req, res) {
      try {
        if (req.file) {
          return this.upload(req, res);
        }

        const newRecord = await Model.create(req.body);
        res.status(201).json({
          message: "Record created successfully",
          data: newRecord
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Special handler for document verification
    async verify(req, res) {
      try {
        const { document_id } = req.params;
        const { verification_status, verification_notes } = req.body;

        const document = await Model.findById(document_id);
        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }

        document.verification_status = verification_status;
        document.verification_notes = verification_notes;
        document.verified_by = req.user.id;
        document.verified_at = new Date();

        await document.save();

        res.json({
          message: "Document verification updated successfully",
          data: document
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Get documents by entity
    async getByEntity(req, res) {
      try {
        const { entity_type, entity_id } = req.params;
        const filters = { 
          [`${entity_type}_id`]: entity_id 
        };

        // For images, get only active one
        if (isImage) {
          filters.status = 'active';
        }

        const records = await Model.find(filters);
        res.json({
          message: "Records retrieved successfully",
          data: records
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Check document compliance
    async checkCompliance(req, res) {
      try {
        const { entity_type, entity_id } = req.params;
        
        const documents = await Model.find({
          [`${entity_type}_id`]: entity_id
        });

        const requiredDocs = entityConfig.required_documents || [];
        const missingDocs = requiredDocs.filter(docType => 
          !documents.some(doc => doc.document_type === docType)
        );

        const expiringDocs = documents.filter(doc => {
          if (doc.document_metadata?.expiry_date) {
            const daysToExpiry = Math.ceil(
              (new Date(doc.document_metadata.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
            );
            return daysToExpiry <= 30 && daysToExpiry > 0;
          }
          return false;
        });

        res.json({
          entity_id,
          compliance_status: missingDocs.length === 0,
          missing_documents: missingDocs,
          expiring_documents: expiringDocs.map(doc => ({
            document_type: doc.document_type,
            expiry_date: doc.document_metadata.expiry_date,
            days_remaining: Math.ceil(
              (new Date(doc.document_metadata.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
            )
          }))
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },

    // Existing methods with updates
    async read(req, res) {
      try {
        const idParamName = Object.keys(req.params)[0];
        let id = req.params[idParamName];

        if (mongoose.Types.ObjectId.isValid(id)) {
          id = mongoose.Types.ObjectId(id);
        }

        const record = await Model.findById(id);
        if (!record) {
          return res.status(404).json({ error: 'Record not found' });
        }

        // For documents, populate verification info
        if (isDocument && record.verified_by) {
          await record.populate('verified_by', 'first_name last_name');
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

          let updateData = req.body;

          // Handle file update if new file is uploaded
          if (req.file) {
              updateData.file_url = req.file.path;
              updateData.file_type = req.file.mimetype.split('/')[1];

              if (isImage) {
                  // Process new image and create thumbnails
                  const imageInfo = await sharp(req.file.path).metadata();
                  await Promise.all([
                      sharp(req.file.path)
                          .resize(50, 50, { fit: 'cover' })
                          .toFile(`${req.file.path}-small`),
                      sharp(req.file.path)
                          .resize(150, 150, { fit: 'cover' })
                          .toFile(`${req.file.path}-medium`)
                  ]);

                  updateData = {
                      ...updateData,
                      original_url: req.file.path,
                      thumbnail_urls: {
                          small: `${req.file.path}-small`,
                          medium: `${req.file.path}-medium`
                      },
                      dimensions: {
                          width: imageInfo.width,
                          height: imageInfo.height
                      }
                  };
              }

              if (isDocument && updateData.document_metadata) {
                  updateData.document_metadata = {
                      ...updateData.document_metadata,
                      document_number: updateData.document_number || undefined,
                      issuing_authority: updateData.issuing_authority || undefined,
                      issue_date: updateData.issue_date || undefined,
                      expiry_date: updateData.expiry_date || undefined
                  };
              }
          }

          const updatedRecord = await Model.findByIdAndUpdate(
              id,
              updateData,
              { new: true, runValidators: true }
          );

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

          const record = await Model.findById(id);
          if (!record) {
              return res.status(404).json({ error: 'Record not found' });
          }

          // Additional checks for images and documents
          if (isImage) {
              // Check if this is the only active image
              if (record.status === 'active') {
                  const activeImages = await Model.countDocuments({
                      [`${record.owner_type}_id`]: record[`${record.owner_type}_id`],
                      status: 'active',
                      _id: { $ne: id }
                  });
                  if (activeImages === 0) {
                      return res.status(400).json({ 
                          error: 'Cannot delete the only active image. Upload a replacement first.' 
                      });
                  }
              }
          }

          if (isDocument) {
              // Check if this is a required document
              const requiredDocs = entityConfig.required_documents || [];
              if (requiredDocs.includes(record.document_type)) {
                  const otherValidDocs = await Model.countDocuments({
                      [`${record.owner_type}_id`]: record[`${record.owner_type}_id`],
                      document_type: record.document_type,
                      status: { $in: ['active', 'pending'] },
                      _id: { $ne: id }
                  });
                  if (otherValidDocs === 0) {
                      return res.status(400).json({ 
                          error: 'Cannot delete required document. Upload a replacement first.' 
                      });
                  }
              }
          }

          const deletedRecord = await Model.findByIdAndDelete(id);
          
          // TODO: Also delete physical files
          // This should be handled by your file storage system

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
          const filters = {};
          const endpoint = entityConfig.endpoints.list;

          // Handle search parameters
          if (endpoint.params?.search && req.query.search) {
              const searchFields = endpoint.params.search.description
                  .split(',')
                  .map(field => field.trim());
              filters.$or = searchFields.map(field => ({
                  [field]: { $regex: req.query.search, $options: 'i' }
              }));
          }

          // Handle specific filters for images and documents
          if (isImage || isDocument) {
              // Filter by entity type/id if provided
              if (req.query.owner_type) filters.owner_type = req.query.owner_type;
              if (req.query.owner_id) filters[`${req.query.owner_type}_id`] = req.query.owner_id;
              
              // Status filter
              if (req.query.status) filters.status = req.query.status;
              
              // Document-specific filters
              if (isDocument) {
                  if (req.query.document_type) filters.document_type = req.query.document_type;
                  if (req.query.verification_status) {
                      filters.verification_status = req.query.verification_status;
                  }
                  
                  // Filter for expiring documents
                  if (req.query.expiring === 'true') {
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      
                      filters['document_metadata.expiry_date'] = {
                          $gte: new Date(),
                          $lte: thirtyDaysFromNow
                      };
                  }
              }
          }

          // Handle sorting
          let sort = {};
          if (req.query.sort_by) {
              const sortField = req.query.sort_by;
              const sortOrder = req.query.sort_order === 'desc' ? -1 : 1;
              sort[sortField] = sortOrder;
          } else {
              // Default sorting
              sort = { createdAt: -1 };
          }

          // Handle pagination
          const page = parseInt(req.query.page) || 1;
          const limit = Math.min(parseInt(req.query.limit) || 10, 100);
          const skip = (page - 1) * limit;

          let query = Model.find(filters);

          // Add specific population for documents
          if (isDocument) {
              query = query.populate('verified_by', 'first_name last_name');
              query = query.populate('uploaded_by', 'first_name last_name');
          }

          const records = await query
              .sort(sort)
              .skip(skip)
              .limit(limit);

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
    // ... other existing methods remain the same ...
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

        // Special cases for file handling endpoints
        if (endpoint.request_payload?.content_type === 'multipart/form-data') {
          return controller.upload(req, res);
        }

        // Handle verification endpoint
        if (endpointName === 'verify' && isDocument) {
          return controller.verify(req, res);
        }

        // Handle compliance check endpoint
        if (endpointName === 'checkCompliance' && isDocument) {
          return controller.checkCompliance(req, res);
        }

        // Handle get by entity endpoint
        if (endpointName === 'getByEntity') {
          return controller.getByEntity(req, res);
        }

        // Default handling
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
