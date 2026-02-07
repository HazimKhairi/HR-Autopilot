
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.2';

async function extractResumeData(req, res) {
  try {
    const { resumeText } = req.body;

    if (!resumeText) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    console.log('🤖 Calling Ollama to parse resume...');
    
    const prompt = `
    You are an expert HR assistant. Extract the following information from the resume text provided below.
    Return the output strictly as a JSON object with the following keys:
    - name (string)
    - email (string)
    - phone (string)
    - skills (array of strings)
    - experience (array of objects with role, company, duration)
    - education (array of objects with degree, school, year)
    - summary (string, brief professional summary)

    Resume Text:
    ${resumeText}

    Ensure the response is valid JSON only, without any markdown formatting or explanation.
    `;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful HR assistant that extracts structured data from resumes. Always return valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        format: 'json', // Enforce JSON mode if supported by the model, otherwise the prompt instruction helps
        stream: false,
        options: { temperature: 0.1 }, // Low temperature for deterministic output
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error: ${response.status} ${text}`);
    }

    const data = await response.json();
    let content = data.message?.content || data.response || '{}';
    
    // Clean up potential markdown code blocks if Ollama includes them
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON from Ollama:', content);
      parsedData = { raw: content, error: 'Failed to parse structured data' };
    }

    res.json({
      success: true,
      data: parsedData,
    });

  } catch (error) {
    console.error('❌ Error extracting resume data:', error.message);
    res.status(500).json({ 
      error: 'Failed to extract resume data',
      message: error.message 
    });
  }
}

module.exports = {
  extractResumeData,
};
