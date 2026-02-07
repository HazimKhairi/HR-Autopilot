// Express Server for Invisible HR
// Main server file that sets up routes and middleware

// Express is a web framework for Node.js.
// It helps us create a server that can listen for requests (like "Get me the homepage")
// and send back responses (like "Here is the HTML file").
const express = require('express');

// CORS (Cross-Origin Resource Sharing) is a security feature.
// Since our Frontend runs on Port 3000 and Backend on Port 5000,
// browsers normally block this. CORS tells the browser "It's okay, let them talk!"
const cors = require('cors');

// dotenv loads secret variables from the .env file (like API keys)
// so we don't not hardcode them in our code.
require('dotenv').config();

// Import controllers
// Controllers are like "managers" that handle specific jobs.
// For example, docController handles everything related to Documents.
const docController = require('./controllers/docController');
const chatController = require('./controllers/chatController');
const complianceController = require('./controllers/complianceController');
const employeeController = require('./controllers/employeeController');
const resumeController = require('./controllers/resumeController');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware are functions that run *before* our main logic.
app.use(cors()); // 1. Allow Frontend to talk to Backend
app.use(express.json()); // 2. Allow us to read JSON data sent in requests

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Invisible HR API is running! 🚀',
    version: '1.0.0',
    endpoints: {
      documents: '/api/contract/*',
      chat: '/api/chat',
      compliance: '/api/compliance/*',
      employee: '/api/employee/*',
    }
  });
});

// ========================================
// Employee Lookup Routes
// ========================================
app.get('/api/employee/by-email/:email', employeeController.getEmployeeByEmail);

// ========================================
// PHASE 1: Document Generation Routes
// ========================================
// When the Frontend sends a POST request to '/api/contract/generate',
// run the 'generateContract' function in the docController.
app.post('/api/contract/generate', docController.generateContract);

// ========================================
// PHASE 2: Conversational HR Assistant Routes
// ========================================
// When the Frontend sends a POST request to '/api/chat',
// run the 'chat' function in the chatController.
app.post('/api/chat', chatController.chat);

// ========================================
// PHASE 3: Compliance Intelligence Routes
// ========================================
app.get('/api/compliance/check', complianceController.checkExpirations);
app.get('/api/compliance/employee/:id', complianceController.getEmployeeCompliance);

// ========================================
// PHASE 4: Resume Extraction Routes
// ========================================
app.post('/api/resume/extract', resumeController.extractResumeData);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
Ready to serve requests!
  `);
});

module.exports = app;
