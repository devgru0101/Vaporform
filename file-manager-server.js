#!/usr/bin/env node

/**
 * Vaporform File Manager Server
 * Full directory browsing, viewing, uploading, and deleting files
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const mime = require('mime-types');

const app = express();
const PORT = process.env.FILES_PORT || 3000;
const BASE_DIR = '/home/scott-sitzer'; // Base directory for file browsing

// Configure multer for file uploads with dynamic destination
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = req.body.path || BASE_DIR;
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the entire home directory
app.use('/static', express.static(BASE_DIR));

// Helper function to check if path is safe
function isPathSafe(requestedPath) {
  const resolvedPath = path.resolve(requestedPath);
  return resolvedPath.startsWith(BASE_DIR);
}

// Helper function to get file info
async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    return {
      name,
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      extension: ext,
      mimeType: mime.lookup(filePath) || 'application/octet-stream'
    };
  } catch (error) {
    return null;
  }
}

// API: List directory contents
app.get('/api/browse', async (req, res) => {
  try {
    const requestedPath = req.query.path || BASE_DIR;
    
    if (!isPathSafe(requestedPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const items = await fs.readdir(requestedPath);
    const itemsInfo = [];

    for (const item of items) {
      // Skip hidden files unless specifically requested
      if (!req.query.showHidden && item.startsWith('.')) continue;
      
      const itemPath = path.join(requestedPath, item);
      const info = await getFileInfo(itemPath);
      if (info) {
        itemsInfo.push(info);
      }
    }

    // Sort: directories first, then files
    itemsInfo.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      currentPath: requestedPath,
      parentPath: requestedPath !== BASE_DIR ? path.dirname(requestedPath) : null,
      items: itemsInfo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get file content (for text files)
app.get('/api/file', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath || !isPathSafe(filePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is a directory' });
    }

    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    
    // For text files, return content
    if (mimeType.startsWith('text/') || 
        mimeType === 'application/json' || 
        mimeType === 'application/javascript' ||
        mimeType === 'application/xml') {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({
        path: filePath,
        content,
        mimeType,
        size: stats.size
      });
    } else {
      // For binary files, return file info only
      res.json({
        path: filePath,
        mimeType,
        size: stats.size,
        isBinary: true,
        downloadUrl: `/api/download?path=${encodeURIComponent(filePath)}`
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Download file
app.get('/api/download', async (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath || !isPathSafe(filePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot download directory' });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: 'File uploaded successfully',
    file: {
      name: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    }
  });
});

// API: Delete file or directory
app.delete('/api/delete', async (req, res) => {
  try {
    const filePath = req.body.path;
    
    if (!filePath || !isPathSafe(filePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }

    res.json({ message: 'Deleted successfully', path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Create directory
app.post('/api/mkdir', async (req, res) => {
  try {
    const { path: dirPath, name } = req.body;
    
    if (!dirPath || !name || !isPathSafe(dirPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newDirPath = path.join(dirPath, name);
    await fs.mkdir(newDirPath, { recursive: true });

    res.json({ message: 'Directory created', path: newDirPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the file manager UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'file-manager-ui.html'));
});

// Old inline UI for reference
app.get('/inline', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vaporform File Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #f5f5f5;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }

        .path-bar {
            background: rgba(255,255,255,0.2);
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            word-break: break-all;
        }

        .toolbar {
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a67d8;
        }

        .btn-secondary {
            background: #e0e0e0;
            color: #333;
        }

        .btn-secondary:hover {
            background: #d0d0d0;
        }

        .container {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .file-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
        }

        .file-item {
            background: white;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid transparent;
        }

        .file-item:hover {
            border-color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .file-item.selected {
            border-color: #764ba2;
            background: #f8f9ff;
        }

        .file-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }

        .file-name {
            font-size: 14px;
            word-break: break-all;
            color: #333;
        }

        .file-size {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }

        .drop-zone {
            border: 3px dashed #667eea;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            background: white;
            margin-bottom: 20px;
            display: none;
        }

        .drop-zone.active {
            display: block;
        }

        .drop-zone.dragover {
            background: #f8f9ff;
            border-color: #764ba2;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            border-radius: 10px;
            padding: 20px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
        }

        .file-preview {
            white-space: pre-wrap;
            font-family: monospace;
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        input[type="file"] {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📁 Vaporform File Manager</h1>
        <div class="path-bar" id="currentPath">/home/scott-sitzer</div>
    </div>

    <div class="toolbar">
        <button class="btn btn-primary" onclick="goUp()">⬆️ Up</button>
        <button class="btn btn-primary" onclick="refresh()">🔄 Refresh</button>
        <button class="btn btn-primary" onclick="showUpload()">📤 Upload</button>
        <button class="btn btn-primary" onclick="createFolder()">📁 New Folder</button>
        <button class="btn btn-secondary" onclick="deleteSelected()">🗑️ Delete</button>
        <input type="file" id="fileInput" multiple onchange="handleFileSelect(event)">
    </div>

    <div class="container">
        <div class="drop-zone" id="dropZone">
            <div style="font-size: 48px; margin-bottom: 10px;">📤</div>
            <div>Drop files here to upload</div>
        </div>
        <div class="file-grid" id="fileGrid">
            <div class="loading">Loading...</div>
        </div>
    </div>

    <div class="modal" id="previewModal">
        <div class="modal-content">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <h3 id="previewTitle">File Preview</h3>
                <button class="btn btn-secondary" onclick="closePreview()">Close</button>
            </div>
            <div id="previewContent" class="file-preview"></div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;
        let currentPath = '/home/scott-sitzer';
        let selectedItem = null;

        // Initialize
        browse(currentPath);

        async function browse(path) {
            currentPath = path;
            document.getElementById('currentPath').textContent = path;
            document.getElementById('fileGrid').innerHTML = '<div class="loading">Loading...</div>';
            
            try {
                const response = await fetch(\`\${API_BASE}/api/browse?path=\${encodeURIComponent(path)}\`);
                const data = await response.json();
                displayItems(data.items, data.parentPath);
            } catch (error) {
                alert('Error loading directory: ' + error.message);
            }
        }

        function displayItems(items, parentPath) {
            const grid = document.getElementById('fileGrid');
            let html = '';

            if (parentPath) {
                html += \`
                    <div class="file-item" onclick="browse('\${parentPath}')">
                        <div class="file-icon">⬆️</div>
                        <div class="file-name">..</div>
                    </div>
                \`;
            }

            items.forEach(item => {
                const icon = item.isDirectory ? '📁' : getFileIcon(item.extension);
                const size = item.isDirectory ? '' : formatSize(item.size);
                
                html += \`
                    <div class="file-item" onclick="handleItemClick('\${item.path}', \${item.isDirectory})" 
                         ondblclick="handleItemDblClick('\${item.path}', \${item.isDirectory})">
                        <div class="file-icon">\${icon}</div>
                        <div class="file-name">\${item.name}</div>
                        <div class="file-size">\${size}</div>
                    </div>
                \`;
            });

            grid.innerHTML = html;
        }

        function handleItemClick(path, isDirectory) {
            // Select item
            document.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
            event.currentTarget.classList.add('selected');
            selectedItem = { path, isDirectory };
        }

        function handleItemDblClick(path, isDirectory) {
            if (isDirectory) {
                browse(path);
            } else {
                previewFile(path);
            }
        }

        async function previewFile(path) {
            try {
                const response = await fetch(\`\${API_BASE}/api/file?path=\${encodeURIComponent(path)}\`);
                const data = await response.json();
                
                document.getElementById('previewTitle').textContent = path.split('/').pop();
                
                if (data.isBinary) {
                    document.getElementById('previewContent').innerHTML = \`
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                            <div>Binary file (\${formatSize(data.size)})</div>
                            <div style="margin-top: 20px;">
                                <a href="\${data.downloadUrl}" class="btn btn-primary" style="text-decoration: none; display: inline-block;">Download</a>
                            </div>
                        </div>
                    \`;
                } else {
                    document.getElementById('previewContent').textContent = data.content;
                }
                
                document.getElementById('previewModal').classList.add('active');
            } catch (error) {
                alert('Error previewing file: ' + error.message);
            }
        }

        function closePreview() {
            document.getElementById('previewModal').classList.remove('active');
        }

        function goUp() {
            const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
            if (parent.startsWith('/home/scott-sitzer')) {
                browse(parent);
            }
        }

        function refresh() {
            browse(currentPath);
        }

        function showUpload() {
            document.getElementById('dropZone').classList.add('active');
            document.getElementById('fileInput').click();
        }

        async function handleFileSelect(event) {
            const files = event.target.files;
            for (let file of files) {
                await uploadFile(file);
            }
            document.getElementById('dropZone').classList.remove('active');
            refresh();
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', currentPath);

            try {
                const response = await fetch(\`\${API_BASE}/api/upload\`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                alert('Error uploading file: ' + error.message);
            }
        }

        async function createFolder() {
            const name = prompt('Enter folder name:');
            if (!name) return;

            try {
                const response = await fetch(\`\${API_BASE}/api/mkdir\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: currentPath, name })
                });
                
                if (response.ok) {
                    refresh();
                } else {
                    throw new Error('Failed to create folder');
                }
            } catch (error) {
                alert('Error creating folder: ' + error.message);
            }
        }

        async function deleteSelected() {
            if (!selectedItem) {
                alert('Please select a file or folder to delete');
                return;
            }

            if (!confirm(\`Delete \${selectedItem.path}?\`)) return;

            try {
                const response = await fetch(\`\${API_BASE}/api/delete\`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: selectedItem.path })
                });
                
                if (response.ok) {
                    selectedItem = null;
                    refresh();
                } else {
                    throw new Error('Failed to delete');
                }
            } catch (error) {
                alert('Error deleting: ' + error.message);
            }
        }

        // Drag and drop
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            document.getElementById('dropZone').classList.add('active', 'dragover');
        });

        document.addEventListener('dragleave', (e) => {
            if (e.clientX === 0 && e.clientY === 0) {
                document.getElementById('dropZone').classList.remove('dragover');
            }
        });

        document.addEventListener('drop', async (e) => {
            e.preventDefault();
            document.getElementById('dropZone').classList.remove('active', 'dragover');
            
            const files = e.dataTransfer.files;
            for (let file of files) {
                await uploadFile(file);
            }
            refresh();
        });

        function getFileIcon(ext) {
            const icons = {
                '.txt': '📝', '.md': '📝', '.doc': '📝', '.docx': '📝',
                '.pdf': '📕', '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️',
                '.gif': '🖼️', '.svg': '🖼️', '.mp4': '🎥', '.avi': '🎥',
                '.mp3': '🎵', '.wav': '🎵', '.zip': '📦', '.rar': '📦',
                '.js': '📜', '.ts': '📜', '.jsx': '📜', '.tsx': '📜',
                '.html': '🌐', '.css': '🎨', '.json': '📋', '.xml': '📋',
                '.py': '🐍', '.java': '☕', '.cpp': '🔧', '.c': '🔧'
            };
            return icons[ext] || '📄';
        }

        function formatSize(bytes) {
            if (!bytes) return '';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }
            return Math.round(bytes * 100) / 100 + ' ' + units[i];
        }
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`📁 Vaporform File Manager running on port ${PORT}`);
  console.log(`🌐 Access at http://localhost:${PORT}`);
  console.log(`📂 Browsing directory: ${BASE_DIR}`);
});

module.exports = app;