const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const createController = require('../controllers/controllerLoader');
const loadConfig = require('../utils/configLoader');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/';
    
    // Determine upload directory based on file type and entity
    if (file.fieldname === 'image') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    }
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileExtension = file.originalname.split('.').pop();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${file.fieldname}-${uniqueSuffix}.${fileExtension}`;
    cb(null, filename);
  }
});

// File filter for different types of uploads
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  } else if (file.fieldname === 'document') {
    // Allow images and PDFs for documents
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for file uploads
const handleFileUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'File upload error', 
      details: err.message 
    });
  } else if (err) {
    return res.status(400).json({ 
      error: 'Invalid file', 
      details: err.message 
    });
  }
  next();
};

const createRoutes = () => {
  const router = express.Router();
  const apiConfigs = loadConfig();

  // Process each entity's routes
  Object.keys(apiConfigs).forEach(entityFileName => {
    const entityConfigFile = apiConfigs[entityFileName];
    const entityKey = Object.keys(entityConfigFile)[0];
    const entityConfig = entityConfigFile[entityKey];
    const controller = createController(entityKey, entityConfig);

    // Add request preprocessing middleware
    const preprocessRequest = (req, res, next) => {
      if (req.file) {
        const fileExtension = req.file.originalname.split('.').pop();
        req.body.file_url = req.file.path;
        req.body.file_type = fileExtension;

        if (req.file.mimetype.startsWith('image/')) {
          req.body.dimensions = {
            width: 0,
            height: 0
          };
        }
      }
      next();
    };

    // Set up routes for each endpoint
    Object.keys(entityConfig.endpoints).forEach(endpointName => {
      const endpoint = entityConfig.endpoints[endpointName];
      const method = endpoint.method.toLowerCase();
      let path = endpoint.path;

      // Replace placeholder params
      path = path.replace(/{(\w+)}/g, ':$1');

      const middlewares = [];
      
      // Add auth middleware for private routes
      if (endpoint.route_type === "private") {
        middlewares.push(authMiddleware);
      }

      // Handle file uploads
      if (endpoint.request_payload?.content_type === 'multipart/form-data') {
        const isImageUpload = entityKey.toLowerCase().includes('image');
        const isDocumentUpload = entityKey.toLowerCase().includes('document');

        if (isImageUpload) {
          middlewares.push(upload.single('image'));
        } else if (isDocumentUpload) {
          middlewares.push(upload.single('document'));
        }
        
        middlewares.push(handleFileUploadError);
        middlewares.push(preprocessRequest);
      }

      if (controller[endpointName]) {
        router[method](path, ...middlewares, controller[endpointName]);
      } else {
        router[method](path, ...middlewares, (req, res) =>
          res.status(501).json({ message: `Implementation pending for ${endpointName}` })
        );
      }
    });
  });

  // Add static file serving for uploads
  router.use('/uploads', express.static('uploads'));

  return router;
};

module.exports = createRoutes;