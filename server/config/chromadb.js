const { ChromaClient } = require('chromadb');

const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
const parsed = new URL(chromaUrl);

const client = new ChromaClient({
  host: parsed.hostname,
  port: parseInt(parsed.port) || 8000,
  ssl: parsed.protocol === 'https:',
});

async function getCollection() {
  return await client.getOrCreateCollection({
    name: 'hr-knowledge',
  });
}

module.exports = { client, getCollection };
