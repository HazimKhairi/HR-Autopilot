const { ChromaClient } = require('chromadb');   
                                                  
  const client = new ChromaClient({               
    path: process.env.CHROMADB_URL ||             
  'http://localhost:8000'                         
  });                                             
                                                  
  async function getCollection() {                
    return await client.getOrCreateCollection({   
      name: 'hr-knowledge',                       
      embeddingFunction: null                     
    });                                           
  }                                               
                                                  
  module.exports = { client, getCollection };