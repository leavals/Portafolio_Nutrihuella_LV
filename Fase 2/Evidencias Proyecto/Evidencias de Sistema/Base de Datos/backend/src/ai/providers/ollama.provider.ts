import axios from 'axios';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b-instruct';

// Genera texto/JSON con Ollama (no streaming)
export async function ollamaGenerate(prompt: string): Promise<string> {
  const url = `${OLLAMA_HOST}/api/generate`;
  const { data } = await axios.post(url, {
    model: OLLAMA_MODEL,
    prompt,
    stream: false,
    options: {
      temperature: 0.6,
      top_p: 0.9,
    }
  }, { timeout: 120000 });
  return data.response as string;
}
