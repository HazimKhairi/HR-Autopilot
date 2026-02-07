require('dotenv').config();                     
const { PrismaClient } = require('@prisma/client');                      
const { getCollection } = require('../config/chromadb');                  
const { generateEmbedding } = require('../utils/embeddings'); 

const prima = new PrismaClient();


async function seedVectors() {
  try{
    console.log('Start seeding data')
    //fetch all policies from sqlite 
    const policies = await prisma.policy.findMany();
     console.log(`Policies found: ${policies.length}`)

     if(policies.length == 0){
      console.log('no policies found');
      return;
     }

     //prepare parallel arrays for chromadb
     const ids = [];
     const documents = [];
     const embeddings = [];
     const metadatas = [];

     for (const policy of policies){
      const embedding = await generateEmbedding(policy.content);
      embeddings.push(embedding)
      metadatas.push({type:'policy',originalId: policy.id});
     }

     //add to chromadb
     const collection = await getCollection();

     await collection.add({
      ids,
      documents,
      embeddings,
      metadatas
     });

     console.log('done seeding')
  }catch(error){
    console.error(error)
    throw error
  }finally{
    await prisma.$disconnect();
    process.exit();
  }
}
