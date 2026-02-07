require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { pinecone, index, indexName } = require('../config/pinecone');
const { generateEmbedding } = require('../utils/embeddings');

const prisma = new PrismaClient();

async function seedVectors() {
  try {
    console.log('🌱 Starting vector seeding...');

    // 1. Fetch all policies from the database
    const policies = await prisma.policy.findMany();
    console.log(`📚 Found ${policies.length} policies to index.`);

    if (policies.length === 0) {
      console.log('⚠️ No policies found. Run "npm run seed" first.');
      return;
    }

    // 2. Prepare vectors
    const vectors = [];
    
    // Re-target index to ensure it's fresh
    const targetIndex = pinecone.index(indexName);

    for (const policy of policies) {
      console.log(`🧠 Generating embedding for policy ID: ${policy.id}...`);
      
      const embedding = await generateEmbedding(policy.content);
      
      vectors.push({
        id: `policy-${policy.id}`,
        values: embedding,
        metadata: {
          type: 'policy',
          content: policy.content,
          originalId: policy.id
        }
      });
    }

    // 3. Upsert to Pinecone
    if (vectors.length > 0) {
      console.log(`🚀 Upserting ${vectors.length} vectors to Pinecone...`);
      // Batching is good practice, but for small datasets, one go is fine
      await targetIndex.upsert({ records: vectors });
      console.log('✅ Upsert complete!');
    }

  } catch (error) {
    console.error('❌ Error seeding vectors:', error);
  } finally {
    await prisma.$disconnect();
    // process.exit() is often needed with async scripts
    process.exit();
  }
}

seedVectors();
