require('dotenv').config();                     
  const { client } =                              
  require('../config/chromadb');                  
  const { generateEmbedding } =                   
  require('../utils/embeddings');                 
                                            
  async function testChromaDB() {                 
    try {                                         
                                        
                                                  
      // Step 1: Connect                          
      console.log('1. Connecting to ChromaDB...');
      const heartbeat = await client.heartbeat(); 
      console.log('   Heartbeat:', heartbeat);    
                                         
                                                   
      // Step 2: Create test collection           
      console.log('2. Creating test collection');                                
      const testCollection = await                
  client.getOrCreateCollection({                  
        name: 'test-collection',                  
        embeddingFunction: null                   
      });                                         
                                                  
      // Step 3: Generate embedding               
      console.log('3. Generating embedding...');  
      const embedding = await                     
  generateEmbedding('Hello World');               
      console.log('   Length:', embedding.length);
                                           
      // Step 4: Add to collection                
      console.log('4. Adding to collection...');  
      await testCollection.add({                  
        ids: ['test-1'],                          
        embeddings: [embedding],                  
        documents: ['Hello World']                
      });                                         
                                           
      // Step 5: Query back                       
      console.log('5. Querying...');              
      const results = await testCollection.query({
        queryEmbeddings: [embedding],             
        nResults: 1                               
      });                                         
                                                  
      if (results.ids[0].length > 0) {            
        console.log('   Found:',                  
  results.documents[0][0]);                       
      } else {                                    
        throw new Error('No results found');      
      }                                           
                                           
      // Step 6: Cleanup                          
      console.log('6. Deleting test               collection...');                                
      await client.deleteCollection({ name:       
  'test-collection' });                           
                                                  
      console.log('\nAll tests passed!');         
                                                  
    } catch (error) {                             
      console.error('Test failed:',               
  error.message);                                 
    }                                             
  }                                               
                                                  
  testChromaDB(); 