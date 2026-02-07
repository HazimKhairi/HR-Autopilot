require('dotenv').config();
const { pinecone, index, indexName } = require('../config/pinecone');
const { generateEmbedding } = require('../utils/embeddings');

async function testConnection() {
  try {
    console.log('🌲 Testing Pinecone connection...');
    console.log(`Using index: ${indexName}`);


    // 1. List indexes to confirm connection
    const indexes = await pinecone.listIndexes();
    console.log('Available indexes:', indexes);

    // Filter to check if index exists
    const indexExists = indexes.indexes && indexes.indexes.some(idx => idx.name === indexName);


    if (!indexExists) {
      console.log(`⚠️ Index "${indexName}" not found. Creating it...`);
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI text-embedding-3-small
        metric: 'cosine',
        spec: { 
          serverless: { 
            cloud: 'aws', 
            region: 'us-east-1' 
          }
        } 
      });
      console.log('⏳ Index creating... waiting for initialization...');
      
      // Wait for index to be ready
      let isReady = false;
      while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const description = await pinecone.describeIndex(indexName);
        if (description.status.ready) {
          isReady = true;
          console.log('✅ Index is ready!');
        } else {
            process.stdout.write('.');
        }
      }
    } else {
        console.log(`✅ Index "${indexName}" already exists.`);
    }

    // 2. Generate a test embedding
    console.log('🧠 Generating test embedding for "Hello World"...');
    const embedding = await generateEmbedding('Hello World');
    console.log(`Embedding generated with length: ${embedding.length}`);

    // Re-target index to ensure it's fresh
    const targetIndex = pinecone.index(indexName);
    
    // 3. Upsert to Pinecone
    console.log('🚀 Upserting vector to Pinecone...');
    const upsertPayload = [
      {
        id: 'test-vector-1',
        values: embedding,
        metadata: { text: 'Hello World', test: true },
      },
    ];
    console.log('Payload type:', typeof upsertPayload);
    console.log('Is Array?', Array.isArray(upsertPayload));
    console.log('Payload length:', upsertPayload.length);
    console.log('First item keys:', Object.keys(upsertPayload[0]));

    await targetIndex.upsert({ records: upsertPayload });
    console.log('✅ Upsert successful');

    // 4. Query from Pinecone
    console.log('🔍 Querying vector from Pinecone...');
    // Give it a moment for consistency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const queryResponse = await targetIndex.query({
      vector: embedding,
      topK: 1,
      includeMetadata: true,
    });


    console.log('Query results:', JSON.stringify(queryResponse, null, 2));

    if (queryResponse.matches.length > 0) {
      console.log('✅ Verification COMPLETE: Successfully connected, embedded, upserted, and queried.');
    } else {
      console.error('❌ Verification FAILED: Could not retrieve the upserted vector.');
    }


  } catch (error) {
    console.error('❌ Verification ERROR:', error);
  } finally {
    process.exit();
  }
}

testConnection();
