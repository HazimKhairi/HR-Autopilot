// Polyfill for PDF.js in Node environment
if (!global.DOMMatrix) {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

const { PDFParse } = require('pdf-parse');
const { z } = require('zod');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama3.1';

// Define strict Zod schema for Resume Data
const ResumeSchema = z.object({
  fullName: z.string().nullable().describe("The full name of the candidate"),
  email: z.string().nullable().describe("Email address"),
  phone: z.string().nullable().describe("Phone number"),
  location: z.string().nullable().optional().describe("City, State, or Country"),
  workExperience: z.array(z.object({
    title: z.string().nullable(),
    company: z.string().nullable(),
    duration: z.string().nullable().describe("e.g. 'Jan 2020 - Present' or '2 years'"),
    description: z.string().nullable().optional()
  })).describe("List of work experiences"),
  education: z.array(z.object({
    degree: z.string().nullable(),
    school: z.string().nullable(),
    year: z.string().nullable().optional()
  })),
  skills: z.array(z.string()).describe("List of technical and soft skills"),
  certifications: z.array(z.string()).optional().describe("List of certifications")
});

async function extractTextFromPdf(buffer) {
  try {
    // New API usage for pdf-parse 2.4.5+
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to parse PDF text');
  }
}

async function queryOllamaWithRetry(text, retries = 3) {
  const prompt = `
    Extract the following information from the resume text provided below.
    Return ONLY a valid JSON object matching this structure:
    {
      "fullName": "string",
      "email": "string",
      "phone": "string",
      "location": "string",
      "workExperience": [{ "title": "string", "company": "string", "duration": "string", "description": "string" }],
      "education": [{ "degree": "string", "school": "string", "year": "string" }],
      "skills": ["string"],
      "certifications": ["string"]
    }

    Resume Text:
    ${text.substring(0, 6000)} // Limit context to reduce load

    Rules:
    1. If a field is missing, use null or an empty array/string as appropriate.
    2. Do NOT include any markdown formatting (like \`\`\`json).
    3. Return RAW JSON only.
  `;

  let lastError = null;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🤖 Ollama attempt ${i + 1}/${retries}...`);
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_CHAT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a precise data extraction assistant. You only speak JSON.',
            },
            { role: 'user', content: prompt },
          ],
          format: 'json',
          stream: false,
          options: { 
            temperature: 0.1,
            num_ctx: 4096,   // Limit context window
            num_thread: 2    // Limit CPU threads to prevent system freeze
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      let content = data.message?.content || '';
      
      // Clean content
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();

      // Parse JSON
      const parsed = JSON.parse(content);

      // Validate with Zod
      const validated = ResumeSchema.parse(parsed);
      
      return validated;

    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      lastError = error;
      // Wait briefly before retry? (Optional)
    }
  }

  throw lastError || new Error('Failed to extract valid data after retries');
}

async function extractResumeData(req, res) {
  try {
    let resumeText = '';

    // Handle File Upload (PDF)
    if (req.file) {
      console.log(`Processing file: ${req.file.originalname}`);
      resumeText = await extractTextFromPdf(req.file.buffer);
    } 
    // Handle Raw Text (Fallback)
    else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
    } 
    else {
      return res.status(400).json({ error: 'No resume file or text provided' });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ error: 'Extracted text is empty or unreadable' });
    }

    console.log('Text extracted, sending to Ollama...');
    const structuredData = await queryOllamaWithRetry(resumeText);

    res.json({
      success: true,
      data: structuredData
    });

  } catch (error) {
    console.error('❌ Resume extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to process resume',
      details: error.message 
    });
  }
}

module.exports = {
  extractResumeData,
  ResumeSchema
};
