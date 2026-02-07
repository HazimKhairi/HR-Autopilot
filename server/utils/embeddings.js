
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

async function generateEmbedding(text) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: text.replace(/\n/g, '')
      })
    },);

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.error}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {generateEmbedding}