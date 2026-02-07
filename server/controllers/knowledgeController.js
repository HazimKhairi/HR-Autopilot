const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const path = require('path');
const { getCollection } = require('../config/chromadb');
const { generateEmbedding } = require('../utils/embeddings');
const { chunkText } = require('../utils/chunker');

/**
 * Upload a document, chunk it, embed chunks, and store in ChromaDB
 * @route POST /api/knowledge/upload
 */
async function uploadDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    if (ext === '.txt') {
      extractedText = req.file.buffer.toString('utf-8');
    } else if (ext === '.pdf') {
      const result = await pdfParse(req.file.buffer);
      extractedText = result.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = result.value;
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type. Use .pdf, .txt, or .docx' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ success: false, error: 'No text could be extracted from the file' });
    }

    const chunks = chunkText(extractedText);
    console.log(`Extracted ${chunks.length} chunks from ${req.file.originalname}`);

    const ids = [];
    const documents = [];
    const embeddings = [];
    const metadatas = [];
    const timestamp = Date.now();

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);
      const embedding = await generateEmbedding(chunks[i]);

      ids.push(`doc-${timestamp}-${i}`);
      documents.push(chunks[i]);
      embeddings.push(embedding);
      metadatas.push({ source: req.file.originalname });
    }

    const collection = await getCollection();
    await collection.add({ ids, documents, embeddings, metadatas });

    console.log(`Uploaded ${chunks.length} chunks from ${req.file.originalname}`);

    res.json({
      success: true,
      chunks: chunks.length,
      filename: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to upload document',
      message: error.message,
    });
  }
}

/**
 * List all uploaded documents (unique source filenames)
 * @route GET /api/knowledge/documents
 */
async function listDocuments(req, res) {
  try {
    const collection = await getCollection();
    const allItems = await collection.get();

    const sources = new Set();
    if (allItems.metadatas) {
      for (const meta of allItems.metadatas) {
        if (meta && meta.source) {
          sources.add(meta.source);
        }
      }
    }

    res.json({
      success: true,
      documents: Array.from(sources),
    });
  } catch (error) {
    console.error('List documents error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to list documents',
      message: error.message,
    });
  }
}

module.exports = { uploadDocument, listDocuments };
