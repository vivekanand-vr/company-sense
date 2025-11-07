import { beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create test log file
const testLogPath = path.join(logsDir, 'test-results.log');

// Set up test environment
beforeAll(() => {
  // Load environment variables for tests
  require('dotenv').config();
  
  // Clear previous test logs
  if (fs.existsSync(testLogPath)) {
    fs.writeFileSync(testLogPath, '');
  }
  
  // Write test session header
  const sessionHeader = `
================================================================================
TEST SESSION STARTED: ${new Date().toISOString()}
================================================================================

`;
  fs.appendFileSync(testLogPath, sessionHeader);
  
  // Override console methods to write to both console and log file
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  
  const logToFile = (level: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(testLogPath, logEntry);
  };
  
  console.log = (...args: any[]) => {
    logToFile('info', ...args);
    originalConsoleLog(...args);
  };
  
  console.error = (...args: any[]) => {
    logToFile('error', ...args);
    originalConsoleError(...args);
  };
  
  console.info = (...args: any[]) => {
    logToFile('info', ...args);
    originalConsoleInfo(...args);
  };
  
  console.log('🧪 Test environment initialized');
  console.log('📝 Test logs will be written to:', testLogPath);
});

afterAll(() => {
  const sessionFooter = `
================================================================================
TEST SESSION COMPLETED: ${new Date().toISOString()}
================================================================================

`;
  fs.appendFileSync(testLogPath, sessionFooter);
  console.log('📄 Test logs saved to:', testLogPath);
});