const { ChromaClient } = require('chromadb');
const client = new ChromaClient({ path: process.env.CHROMADB_URL || 'localhost:8000'})
async function getCollection() {
  return await client.getCollection({
    name: 'hr-knowledge',
    embeddingFunction: null
  })
}

module.exports = { client,getCollection}
