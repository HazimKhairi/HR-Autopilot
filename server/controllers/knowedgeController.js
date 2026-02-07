const {PrismaClient} = require('@prisma/client');
const {getCollection} = require('../config/chromadb');
const { generateEmbedding} = require('../utils/embeddings');

const prisma = new PrismaClient();

async function chat(req,res){
    try{

        //input validation
        const { message,email } = req.body;

        if(!message || !email){
            return res.status(400).json({
                success: false,
                error: 'Message and email are required'
            });
        }

        //get employee detail for personalize responses
        const employee = await prisma.employee.findUnique({
            where: {email: email.toLowerCase()}
        });

        if(!employee){
            return res.status(404).json({
                success: false,
                error: 'Employee not found'
            });         
        }
         //convert question to data vector
            const queryVector = await generateEmbedding(message);
            
            //find similar policy which is very similar with question
            const collection = await getCollection();
            const result = await collection.query({queryEmbeddings: [queryVector],nResults:3})

            const relevantDocs = results.documents[0] || [];

            const context = relevantDocs.join('\n--\n')

            //build prompt for AI
            const systemPrompt = `You are a helpful HR  
  assistant for the company.                      
                                                  
  EMPLOYEE CONTEXT:                               
  - Name: ${employee.name}                        
  - Role: ${employee.role}                        
  - Country: ${employee.country}                  
  - Leave Balance: ${employee.leaveBalance} days  
                                                  
  POLICY CONTEXT:                                 
  ${context}                                      
                                                  
  INSTRUCTIONS:                                   
  Answer based ONLY on the provided context. If   
  the answer is not in the context, say you don't 
  know.`;

  //call ollama llm
  const ollamaResponse = await fetch(`${process.env.OLLAMA_BASE_URL}/api/chat`,
    {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({})
    }
  )

     
    }catch(error){

    }
}