import fs from "fs";
import path from "path";

// Define log levels as a type (better than string)
type LogLevel = "info" | "warn" | "error" | "debug";

const logDir: string = path.join(__dirname, "../../logs");

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true }); // recursive for safety
}

const logFile: string = path.join(logDir, "app.log");

// Logger function with types
const logger = (
  level: LogLevel,
  message: string,
  error?: Error
): void => {
  const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}]: ${message}\n`;

  fs.appendFileSync(logFile, logMessage);

  if (error) {
    fs.appendFileSync(logFile, `${error.stack}\n`);
  }
};

export default logger;
