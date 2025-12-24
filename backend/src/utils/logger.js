const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, 'app.log');

const logger = (level, message, error) => {
  const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}]: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  if (error) {
    fs.appendFileSync(logFile, `${error.stack}\n`);
  }
};

module.exports = logger;
