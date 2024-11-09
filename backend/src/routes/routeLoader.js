const express = require('express');
const createController = require('../controllers/controllerLoader');
const loadConfig = require('../utils/configLoader');
const authMiddleware = require('../middleware/authMiddleware');

const apiConfigs = loadConfig();

const createRoutes = () => {
  const router = express.Router();

  Object.keys(apiConfigs).forEach(entityFileName => {
    const entityConfigFile = apiConfigs[entityFileName];
    const entityKey = Object.keys(entityConfigFile)[0];
    const entityConfig = entityConfigFile[entityKey];
    const controller = createController(entityKey, entityConfig);

    Object.keys(entityConfig.endpoints).forEach(endpointName => {
      const endpoint = entityConfig.endpoints[endpointName];
      const method = endpoint.method.toLowerCase();
      let path = endpoint.path;

      // Replace placeholder `{employee_id}` with Express route parameter `:employee_id`
      path = path.replace(/{(\w+)}/g, ':$1');

      const middlewares = [];
      if (endpoint.route_type === "private") {
        middlewares.push(authMiddleware); // Protect private routes with authMiddleware
      }

      if (controller[endpointName]) {
        router[method](path, ...middlewares, controller[endpointName]);
      } else {
        router[method](path, ...middlewares, (req, res) =>
          res.status(501).json({ message: `Implementation is pending for ${endpointName}` })
        );
      }
    });
  });

  return router;
};

module.exports = createRoutes;
