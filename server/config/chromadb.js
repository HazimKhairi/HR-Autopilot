const {ChromaClient} = require('chromadb');

//pointing to running chromadb docker
const client = new ChromaClient({
  path: process.env.CHROMADB_URL || "http://localhost:8000"
});


//collection name where store policy embedding
async function getCollection(){
  return await client.getOrCreateCollection({name:'hr-knowledge',embeddingFunction:null})
}

module.exports = {client , getCollection};

