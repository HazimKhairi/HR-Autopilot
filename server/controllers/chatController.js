const { PrismaClient } = require('@prisma/client');
const { getCollection } = require('../config/chromadb');
const { generateEmbedding } = require('../utils/embeddings');

const prisma = new PrismaClient();
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

async function chat(req, res) {
  try {
    const { message, email } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const employee = await prisma.employee.findUnique({
      where: { email: email.toLowerCase() },
      select: { name: true, role: true, country: true, leaveBalance: true },
    });

    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    console.log(`Chat from ${employee.name}: "${message}"`);

    const queryVector = await generateEmbedding(message);

    const collection = await getCollection();
    const results = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 3,
    });

    const retrievedDocs = results.documents[0] || [];
    const context = retrievedDocs.length > 0
      ? retrievedDocs.join('\n---\n')
      : 'No specific policy documents were found for this query.';

    const systemPrompt = `You are a helpful HR assistant for the company. Answer questions based ONLY on the provided context. If the answer is not in the context, say you don't know.

Employee Info:
- Name: ${employee.name}
- Role: ${employee.role}
- Country: ${employee.country}
- Leave Balance: ${employee.leaveBalance} days

Company Documents:
${context}`;

    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_CHAT_MODEL || 'llama3.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama error: ${ollamaResponse.statusText}`);
    }

    const data = await ollamaResponse.json();

    console.log('Chat response generated');

    res.json({
      success: true,
      response: data.message.content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat',
      message: error.message,
    });
  }
}

module.exports = { chat };
