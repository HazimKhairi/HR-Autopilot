const path = require('path');
const fs = require('fs');
const multer = require('multer');
const {
  CATEGORIES,
  ensureBaseDirs,
  sanitizeFilename,
  getCategoryFolder,
  readIndex,
  addIndexEntry,
  updateIndexEntry,
  findIndexEntry,
  movePhysicalFile,
} = require('../utils/kbUtils');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt'].includes(ext)) cb(null, true);
    else cb(new Error('Only .pdf, .docx, and .txt files are allowed'));
  },
});

async function uploadFile(req, res) {
  try {
    ensureBaseDirs();
    const { name, category, description, uploader } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'File name is required' });
    }
    if (String(name).length > 100) {
      return res.status(400).json({ success: false, error: 'File name exceeds 100 characters' });
    }
    if (description && String(description).length > 500) {
      return res.status(400).json({ success: false, error: 'Description exceeds 500 characters' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const user = uploader || 'admin';
    const chosenCategory = CATEGORIES.includes(category) ? category : 'Other';
    const baseName = sanitizeFilename(name);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const timestamp = Date.now();
    const filename = `${timestamp}_${baseName}${ext || ''}`;
    const dir = getCategoryFolder(chosenCategory);
    const filepath = path.join(dir, filename);

    fs.writeFileSync(filepath, req.file.buffer);

    const entry = addIndexEntry({
      id: filename,
      filename,
      name: baseName,
      category: chosenCategory,
      description: description || '',
      uploader: user,
      uploadDate: new Date().toISOString(),
      deletedAt: null,
    });

    return res.json({ success: true, file: entry });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function listFiles(req, res) {
  try {
    const { q, category, includeDeleted, sortBy = 'date', sortDir = 'desc' } = req.query;
    const index = readIndex();
    let files = index.files.slice();

    if (!includeDeleted) files = files.filter(f => !f.deletedAt);
    if (category && CATEGORIES.includes(category)) {
      files = files.filter(f => f.category === category);
    }
    if (q) {
      const s = String(q).toLowerCase();
      files = files.filter(f =>
        f.name.toLowerCase().includes(s) ||
        (f.description || '').toLowerCase().includes(s)
      );
    }
    if (sortBy === 'name') {
      files.sort((a, b) => a.name.localeCompare(b.name) * (sortDir === 'asc' ? 1 : -1));
    } else if (sortBy === 'category') {
      files.sort((a, b) => a.category.localeCompare(b.category) * (sortDir === 'asc' ? 1 : -1));
    } else {
      files.sort((a, b) =>
        (new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()) * (sortDir === 'asc' ? 1 : -1)
      );
    }

    return res.json({ success: true, files });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function downloadFile(req, res) {
  try {
    const { id } = req.params;
    const { index, i } = findIndexEntry(id);
    if (i < 0) return res.status(404).json({ success: false, error: 'File not found' });
    const file = index.files[i];
    const dir = getCategoryFolder(file.category);
    const filePath = path.join(dir, file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File missing on disk' });
    }
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function updateFile(req, res) {
  try {
    const { id } = req.params;
    const patch = {};
    const name = req.body.name;
    const category = req.body.category;
    const description = req.body.description;

    const { index, i } = findIndexEntry(id);
    if (i < 0) return res.status(404).json({ success: false, error: 'File not found' });
    const file = index.files[i];

    let newCategory = file.category;
    let newFilename = file.filename;

    if (typeof name === 'string') {
      if (!name.trim()) return res.status(400).json({ success: false, error: 'Invalid name' });
      if (name.length > 100) return res.status(400).json({ success: false, error: 'Name too long' });
      const baseName = sanitizeFilename(name);
      const ext = path.extname(file.filename);
      newFilename = `${file.filename.split('_')[0]}_${baseName}${ext}`;
      patch.name = baseName;
    }
    if (typeof category === 'string' && CATEGORIES.includes(category)) {
      newCategory = category;
      patch.category = category;
    }
    if (typeof description === 'string') {
      if (description.length > 500) return res.status(400).json({ success: false, error: 'Description too long' });
      patch.description = description;
    }

    const moved = movePhysicalFile(file, newCategory, newFilename);
    if (!moved) return res.status(500).json({ success: false, error: 'Failed to move file' });

    patch.filename = newFilename;
    const updated = updateIndexEntry(id, patch);
    return res.json({ success: true, file: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteFile(req, res) {
  try {
    const { id } = req.params;
    const updated = updateIndexEntry(id, { deletedAt: new Date().toISOString() });
    if (!updated) return res.status(404).json({ success: false, error: 'File not found' });
    return res.json({ success: true, file: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function restoreFile(req, res) {
  try {
    const { id } = req.params;
    const updated = updateIndexEntry(id, { deletedAt: null });
    if (!updated) return res.status(404).json({ success: false, error: 'File not found' });
    return res.json({ success: true, file: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function bulkDelete(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    const when = new Date().toISOString();
    const results = [];
    for (const id of ids) {
      const updated = updateIndexEntry(id, { deletedAt: when });
      if (updated) results.push(updated.id);
    }
    return res.json({ success: true, deleted: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  upload,
  uploadFile,
  listFiles,
  downloadFile,
  updateFile,
  deleteFile,
  restoreFile,
  bulkDelete,
};
