require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { getCollection } = require('../config/chromadb');
const { generateEmbedding } = require('../utils/embeddings');

const prisma = new PrismaClient();

async function seedVectors() {
  try {
    console.log('Start seeding data');

    const policies = await prisma.policy.findMany();
    console.log(`Policies found: ${policies.length}`);

    if (policies.length === 0) {
      console.log('No policies found');
      return;
    }

    const ids = [];
    const documents = [];
    const embeddings = [];
    const metadatas = [];

    for (const policy of policies) {
      console.log(`Embedding policy ${policy.id}...`);
      const embedding = await generateEmbedding(policy.content);

      ids.push(`policy-${policy.id}`);
      documents.push(policy.content);
      embeddings.push(embedding);
      metadatas.push({ type: 'policy', originalId: String(policy.id) });
    }

    const collection = await getCollection();

    await collection.add({
      ids,
      documents,
      embeddings,
      metadatas,
    });

    console.log(`Done seeding ${policies.length} policies into ChromaDB`);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

seedVectors();
