// PHASE 2: Conversational HR Assistant Controller
// Purpose: Self-service chatbot with RAG (Retrieval Augmented Generation)
// Uses OpenAI Function Calling to determine which tool to use

const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * TOOL 1: Get Leave Balance
 * This is a "Tool" or "Function" that the AI can choose to use.
 * Usage: The AI will call this if the user asks "How much leave do I have?"
 */
async function getLeaveBalance(employeeIdOrEmail) {
  // Debug log to see when this tool is actually called
  console.log(`🔍 Tool: Getting leave balance for ${employeeIdOrEmail}`);
  
  // Try to find employee by ID first, then by email
  let employee;
  
  // Check if it's a number (employeeId) or email
  if (!isNaN(employeeIdOrEmail)) {
    employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeIdOrEmail) },
      select: { name: true, leaveBalance: true },
    });
  } else {
    employee = await prisma.employee.findUnique({
      where: { email: employeeIdOrEmail.toLowerCase() },
      select: { name: true, leaveBalance: true },
    });
  }

  if (!employee) {
    return { error: 'Employee not found' };
  }

  return {
    employeeName: employee.name,
    leaveBalance: employee.leaveBalance,
    message: `${employee.name} has ${employee.leaveBalance} days of leave remaining.`,
  };
}

/**
 * TOOL 2: Read Policy
 * Retrieves policy information from database (Basic RAG)
 * Searches for relevant policies based on query
 */
const { pinecone, index, indexName } = require('../config/pinecone');
const { generateEmbedding } = require('../utils/embeddings');

/**
 * TOOL 2: Read Policy (Enhanced with Vector Search)
 * Retrieves policy information from Pinecone using semantic search
 */
async function readPolicy(query = '') {
  console.log(`📚 Tool: Reading policy with query: "${query}"`);

  if (!query) {
    // Fallback if no query: return list of available policies (titles/summaries)
    // Or just return a generic message asking for specifics.
    const policies = await prisma.policy.findMany({ take: 5 });
    return {
      message: 'Please specify what policy you are looking for.',
      availablePolicies: policies.map(p => p.content.substring(0, 50) + '...'),
    };
  }

  try {
    // 1. Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Query Pinecone
    const targetIndex = pinecone.index(indexName);
    const searchResults = await targetIndex.query({
      vector: queryEmbedding,
      topK: 3, // Fetch top 3 most relevant policies
      includeMetadata: true,
    });

    console.log(`🔍 Found ${searchResults.matches.length} matches in Pinecone`);

    if (searchResults.matches.length === 0) {
      return { message: 'No relevant policies found.' };
    }

    // 3. Extract content
    const relevantContent = searchResults.matches
      .map(match => `[Relevance: ${(match.score * 100).toFixed(0)}%] ${match.metadata.content}`)
      .join('\n\n');

    return {
      policiesFound: searchResults.matches.length,
      content: relevantContent,
    };

  } catch (error) {
    console.error('❌ Error searching policies:', error);
    return { error: 'Failed to retrieve policy information.' };
  }
}

/**
 * Chat Endpoint - Main AI Agent with Function Calling
 * @route POST /api/chat
 * @param {string} message - User's message
 * @param {number} employeeId - ID of the employee asking (for context)
 */
async function chat(req, res) {
  try {
    // 1. Get data from the Frontend request
    // We expect 'message' (the question) and user identification (email or ID)
    const { message, employeeId, email } = req.body;

    // validation: Ensure message exists
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Message is required' 
      });
    }

    // 2. Identify who is talking
    // We prefer using 'email' but support 'employeeId' as a backup.
    const employeeIdentifier = email || employeeId;
    
    // validation: Ensure we know who the user is
    if (!employeeIdentifier) {
      return res.status(400).json({ 
        success: false,
        error: 'Either email or employeeId is required' 
      });
    }

    console.log(`💬 Chat request: "${message}" from ${email ? 'email: ' + email : 'employee: ' + employeeId}`);

    // 3. Build the User Context
    // We fetch details from the database so the AI knows who it is talking to.
    let employeeContext = '';
    
    // Fetch employee details from Database (Prisma)
    const employeeData = await prisma.employee.findUnique({
      where: email 
        ? { email: email.toLowerCase() } 
        : { id: parseInt(employeeId) },
      select: { name: true, role: true, country: true } // Only fetch what we need
    });

    // If found, create a "System Prompt" snippet
    if (employeeData) {
      employeeContext = `
User Context:
- Name: ${employeeData.name}
- Role: ${employeeData.role}
- Country: ${employeeData.country}
- ID/Email: ${employeeIdentifier}

IMPORTANT: You already know who the user is. DO NOT ask for their Name, Employee ID, or Email.
If they ask about their own data (like leave balance), just call the relevant function without asking for ID.`;
    }

    // 4. Define "Tools" for the AI
    // We tell OpenAI: "Here are functions you can ask me to run."
    // We don't run them yet; we just describe them.
    const tools = [
      {
        type: 'function',
        function: {
          name: 'getLeaveBalance', // Matches our function name above
          description: 'Get the leave balance (remaining leave days) for the current employee.',
          parameters: {
            type: 'object',
            properties: {
              employeeId: {
                type: 'string',
                description: 'Optional: ID or Email is already known from context. Only provide if asking for SOMEONE ELSE.',
              },
            },
          },
        },
      },
      // ... we can add more tools here
      {
        type: 'function',
        function: {
          name: 'readPolicy',
          description: 'Read company policies. Can search for specific policy content by keyword.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Optional: keyword to search for in policies (e.g., "lunch", "leave", "remote")',
              },
            },
          },
        },
      },
    ];

    // Initial AI call with function calling enabled
    const initialMessages = [
      {
        role: 'system',
        content: `You are a helpful HR assistant. 
${employeeContext}

You can help with:
1. Checking leave balance
2. Answering policy questions

Use the available tools to provide accurate information. Be friendly and professional.`,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // 5. First Call to OpenAI
    // We send: System instructions + User's Message + List of Tools
    // OpenAI will decide: "Should I reply with text? OR Should I call a tool?"
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: initialMessages,
      tools: tools,
      tool_choice: 'auto', // 'auto' = AI decides if it needs a tool or not at all
    });

    let responseMessage = response.choices[0].message;

    // 6. Check if AI wants to use a Tool
    if (responseMessage.tool_calls) {
      // The AI said: "Please run a tool for me, then tell me the result."
      console.log('🤖 AI wants to use a tool...');

      // Extend the conversation history so OpenAI knows what happened so far
      const messages = [
        ...initialMessages,
        responseMessage, // Include the AI's "I want to call a tool" message
      ];

      // Process each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🛠️ AI calling tool: ${functionName}`, functionArgs);

        let functionResponse;

        // Execute the appropriate function
        if (functionName === 'getLeaveBalance') {
          // Use email or employeeId from request body if not provided in function args
          const empIdentifier = functionArgs.employeeId || employeeIdentifier;
          functionResponse = await getLeaveBalance(empIdentifier);
        } else if (functionName === 'readPolicy') {
          functionResponse = await readPolicy(functionArgs.query);
        }

        // Add function response to conversation
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(functionResponse),
        });
      }

      // Get final response from AI after function execution
      const finalResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
      });

      responseMessage = finalResponse.choices[0].message;
    }

    console.log('✅ Chat response generated');

    // Return the AI's final response
    res.json({
      success: true,
      response: responseMessage.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in chat:', error.message);
    res.status(500).json({ 
      error: 'Failed to process chat',
      message: error.message 
    });
  }
}

module.exports = {
  chat,
  getLeaveBalance, // Export for testing
  readPolicy,      // Export for testing
};
