#!/usr/bin/env node

/**
 * Vaporform Files Server
 * Simple file service running on port 3000
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

const app = express();
const PORT = process.env.FILES_PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Vaporform Files Server',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// List files endpoint
app.get('/files', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const files = await fs.readdir(uploadsDir);
    const fileDetails = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(uploadsDir, filename);
        const stats = await fs.stat(filePath);
        return {
          name: filename,
          size: stats.size,
          modified: stats.mtime,
          url: `http://localhost:${PORT}/${filename}`
        };
      })
    );
    
    res.json({
      files: fileDetails,
      count: fileDetails.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// Upload file endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded'
    });
  }

  res.json({
    message: 'File uploaded successfully',
    file: {
      name: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `http://localhost:${PORT}/${req.file.filename}`
    }
  });
});

// Delete file endpoint
app.delete('/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    await fs.unlink(filePath);
    res.json({
      message: 'File deleted successfully',
      filename: filename
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        error: 'File not found',
        filename: req.params.filename
      });
    } else {
      res.status(500).json({
        error: 'Failed to delete file',
        message: error.message
      });
    }
  }
});

// Root endpoint - serve HTML UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload-ui.html'));
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    service: 'Vaporform Files Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      listFiles: 'GET /files',
      uploadFile: 'POST /upload',
      deleteFile: 'DELETE /files/:filename',
      staticFiles: '/:filename'
    },
    port: PORT
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`📁 Vaporform Files Server running on port ${PORT}`);
  console.log(`🌐 Service available at http://localhost:${PORT}`);
  console.log(`📊 Health check at http://localhost:${PORT}/health`);
});

module.exports = app;