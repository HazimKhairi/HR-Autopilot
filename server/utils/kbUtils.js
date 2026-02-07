const fs = require('fs');
const path = require('path');

const BASE_UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'knowledge-base');
const INDEX_FILE = path.join(BASE_UPLOAD_DIR, 'index.json');
const CATEGORIES = ['Policy', 'Procedure', 'FAQ', 'Manual', 'Other'];

function ensureBaseDirs() {
  if (!fs.existsSync(BASE_UPLOAD_DIR)) {
    fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
  }
  for (const c of CATEGORIES) {
    const dir = path.join(BASE_UPLOAD_DIR, c.toLowerCase());
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  if (!fs.existsSync(INDEX_FILE)) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify({ files: [] }, null, 2), 'utf-8');
  }
}

function sanitizeFilename(name) {
  const trimmed = String(name || '').trim().slice(0, 100);
  const replaced = trimmed.replace(/\s+/g, '-');
  const safe = replaced.replace(/[^a-zA-Z0-9._-]/g, '');
  return safe || 'file';
}

function getCategoryFolder(category) {
  const c = String(category || '').trim();
  const normalized = CATEGORIES.includes(c) ? c : 'Other';
  return path.join(BASE_UPLOAD_DIR, normalized.toLowerCase());
}

function readIndex() {
  ensureBaseDirs();
  const raw = fs.readFileSync(INDEX_FILE, 'utf-8');
  const json = JSON.parse(raw || '{}');
  if (!json.files) json.files = [];
  return json;
}

function writeIndex(index) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

function buildIndex() {
  ensureBaseDirs();
  const files = [];
  for (const c of CATEGORIES) {
    const dir = getCategoryFolder(c);
    const items = fs.readdirSync(dir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name);
    for (const name of items) {
      const stamp = name.split('_')[0];
      const base = name.substring(stamp.length + 1, name.lastIndexOf('.')) || name;
      files.push({
        id: name,
        filename: name,
        name: base,
        category: c,
        description: '',
        uploader: 'system',
        uploadDate: new Date(Number(stamp) || Date.now()).toISOString(),
        deletedAt: null,
      });
    }
  }
  writeIndex({ files });
  return { files };
}
function addIndexEntry(entry) {
  const index = readIndex();
  index.files.push(entry);
  writeIndex(index);
  return entry;
}

function findIndexEntry(id) {
  const index = readIndex();
  const i = index.files.findIndex(f => f.id === id);
  return { index, i };
}

function updateIndexEntry(id, patch) {
  const { index, i } = findIndexEntry(id);
  if (i < 0) return null;
  index.files[i] = { ...index.files[i], ...patch };
  writeIndex(index);
  return index.files[i];
}

function removePhysicalFileById(id) {
  const { index, i } = findIndexEntry(id);
  if (i < 0) return false;
  const file = index.files[i];
  const dir = getCategoryFolder(file.category);
  const filePath = path.join(dir, file.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function movePhysicalFile(file, newCategory, newFilename) {
  const oldDir = getCategoryFolder(file.category);
  const oldPath = path.join(oldDir, file.filename);
  const newDir = getCategoryFolder(newCategory);
  const newPath = path.join(newDir, newFilename);
  ensureBaseDirs();
  if (!fs.existsSync(oldPath)) return false;
  fs.renameSync(oldPath, newPath);
  return true;
}

module.exports = {
  BASE_UPLOAD_DIR,
  INDEX_FILE,
  CATEGORIES,
  ensureBaseDirs,
  sanitizeFilename,
  getCategoryFolder,
  readIndex,
  writeIndex,
  addIndexEntry,
  findIndexEntry,
  updateIndexEntry,
  removePhysicalFileById,
  movePhysicalFile,
  buildIndex,
};
