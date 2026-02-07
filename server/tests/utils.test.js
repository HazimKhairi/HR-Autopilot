const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  sanitizeFilename,
  getCategoryFolder,
  buildIndex,
  BASE_UPLOAD_DIR,
  CATEGORIES,
} = require('../utils/kbUtils');

function testSanitizeFilename() {
  assert.strictEqual(sanitizeFilename('  My File .pdf  '), 'My-File-.pdf');
  assert.strictEqual(sanitizeFilename('weird*name<>?'), 'weirdname');
  assert.ok(sanitizeFilename('').length > 0);
}

function testGetCategoryFolder() {
  const p = getCategoryFolder('Policy');
  assert.ok(p.includes(path.join('uploads', 'knowledge-base', 'policy')));
  const other = getCategoryFolder('Unknown');
  assert.ok(other.endsWith(path.join('uploads', 'knowledge-base', 'other')));
}

function testBuildIndex() {
  // Prepare dummy files
  if (!fs.existsSync(BASE_UPLOAD_DIR)) fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
  for (const c of CATEGORIES) {
    const dir = getCategoryFolder(c);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
  const stamp = Date.now();
  const filePath = path.join(getCategoryFolder('Policy'), `${stamp}_sample.txt`);
  fs.writeFileSync(filePath, 'hello', 'utf-8');
  const index = buildIndex();
  const found = index.files.find(f => f.filename.endsWith('sample.txt'));
  assert.ok(found, 'sample.txt should be in index');
}

function run() {
  try {
    testSanitizeFilename();
    testGetCategoryFolder();
    testBuildIndex();
    console.log('kbUtils tests passed');
    process.exit(0);
  } catch (e) {
    console.error('kbUtils tests failed:', e.message);
    process.exit(1);
  }
}

run();
