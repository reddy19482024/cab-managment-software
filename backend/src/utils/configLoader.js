const fs = require('fs');
const path = require('path');

const loadConfig = () => {
  const apiConfigPath = path.join(__dirname, '../config/api/');
  
  console.log("Checking if config directory exists at:", apiConfigPath);

  // Check if the directory exists
  if (!fs.existsSync(apiConfigPath)) {
    console.error("Directory does not exist:", apiConfigPath);
    throw new Error(`Configuration directory not found at path: ${apiConfigPath}`);
  }

  const apiFiles = fs.readdirSync(apiConfigPath);
  if (apiFiles.length === 0) {
    console.error("No configuration files found in:", apiConfigPath);
    throw new Error("No API configuration files found.");
  }

  const apiConfigs = {};

  apiFiles.forEach(file => {
    const filePath = path.join(apiConfigPath, file);
    console.log(`Loading config for entity from file: ${filePath}`);
    const entityName = path.basename(file, '.json');
    apiConfigs[entityName] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  });

  return apiConfigs;
};

module.exports = loadConfig;
