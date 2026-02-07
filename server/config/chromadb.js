let clientInstance = null;

async function getClient() {
  if (!clientInstance) {
    const { ChromaClient } = await import('chromadb');
    const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:8000';
    const parsed = new URL(chromaUrl);
    clientInstance = new ChromaClient({
      host: parsed.hostname,
      port: parseInt(parsed.port) || 8000,
      ssl: parsed.protocol === 'https:',
    });
  }
  return clientInstance;
}

async function getCollection() {
  const client = await getClient();
  return await client.getOrCreateCollection({
    name: 'hr-knowledge',
  });
}

module.exports = { getClient, getCollection };
