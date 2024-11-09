// frontend/src/utils/configValidator.js
export const CONFIG_SCHEMAS = {
    app: {
      required: ['name', 'version', 'theme', 'layouts', 'defaultRoute'],
      structure: {
        name: 'string',
        version: 'string',
        theme: 'object',
        layouts: 'object',
        defaultRoute: 'string'
      }
    },
    page: {
      required: ['path', 'layout'],
      structure: {
        path: 'string',
        layout: 'string',
        title: 'string',
        permissions: 'array',
        sections: 'array',
        api: 'object'
      }
    },
    api: {
      required: ['url', 'method'],
      structure: {
        url: 'string',
        method: 'string',
        params: 'object',
        headers: 'object'
      }
    }
  };
  
  export class ConfigValidator {
    static validateConfig(config, type) {
      const schema = CONFIG_SCHEMAS[type];
      if (!schema) {
        throw new Error(`No validation schema found for type: ${type}`);
      }
  
      const errors = [];
  
      // Check required fields
      schema.required.forEach(field => {
        if (!config[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      });
  
      // Validate structure
      Object.entries(schema.structure).forEach(([field, expectedType]) => {
        if (config[field] && typeof config[field] !== expectedType) {
          if (expectedType === 'array' && !Array.isArray(config[field])) {
            errors.push(`Field ${field} should be an array`);
          } else if (typeof config[field] !== expectedType) {
            errors.push(
              `Field ${field} should be type ${expectedType}, got ${typeof config[field]}`
            );
          }
        }
      });
  
      return {
        valid: errors.length === 0,
        errors
      };
    }
  }