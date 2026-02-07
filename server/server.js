const express = require('express');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const multer = require('multer');

// Import controllers
const docController = require('./controllers/docController');
const chatController = require('./controllers/chatController');
const complianceController = require('./controllers/complianceController');
const employeeController = require('./controllers/employeeController');
const resumeController = require('./controllers/resumeController');
const knowledgeController = require('./controllers/knowledgeController');
const kbController = require('./controllers/kbController');

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.txt', '.docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .txt, and .docx files are allowed'));
    }
  },
});

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({
    message: 'Invisible HR API is running!',
    version: '1.0.0',
    endpoints: {
      documents: '/api/contract/*',
      chat: '/api/chat',
      compliance: '/api/compliance/*',
      employee: '/api/employee/*',
      knowledge: '/api/knowledge/*',
    }
  });
});
app.get('/api/employee/by-email/:email', employeeController.getEmployeeByEmail);
app.post('/api/contract/generate', docController.generateContract);
app.post('/api/contract/render-pdf', docController.renderHtmlToPdf);

app.post('/api/chat', chatController.chat);
app.get('/api/compliance/check', complianceController.checkExpirations);
app.get('/api/compliance/employee/:id', complianceController.getEmployeeCompliance);

app.post('/api/resume/extract', upload.single('resume'), resumeController.extractResumeData);

app.post('/api/knowledge/upload', upload.single('file'), knowledgeController.uploadDocument);
app.get('/api/knowledge/documents', knowledgeController.listDocuments);

// Knowledge-base management
app.post('/api/kb/upload', kbController.upload.single('file'), kbController.uploadFile);
app.get('/api/kb/files', kbController.listFiles);
app.get('/api/kb/files/:id/download', kbController.downloadFile);
app.put('/api/kb/files/:id', kbController.updateFile);
app.delete('/api/kb/files/:id', kbController.deleteFile);
app.post('/api/kb/files/:id/restore', kbController.restoreFile);
app.post('/api/kb/files/bulk-delete', kbController.bulkDelete);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});
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
