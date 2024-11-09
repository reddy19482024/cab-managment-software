const fs = require("fs");
const path = require("path");

function loadJSONConfigs(subdirectory) {
  const configPath = path.join(__dirname, "../../config", subdirectory);
  const files = fs.readdirSync(configPath);
  const configs = {};

  files.forEach(file => {
    const filePath = path.join(configPath, file);
    const content = fs.readFileSync(filePath, "utf8");
    const config = JSON.parse(content);
    const configName = path.basename(file, ".json");
    configs[configName] = config;
  });

  return configs;
}

module.exports = { loadJSONConfigs };
