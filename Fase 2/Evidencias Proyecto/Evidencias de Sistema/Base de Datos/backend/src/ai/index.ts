import { ollamaGenerate } from './providers/ollama.provider';

type Provider = 'ollama';

const PROVIDER = (process.env.AI_PROVIDER || 'ollama') as Provider;

export async function aiGenerate(prompt: string): Promise<string> {
  switch (PROVIDER) {
    case 'ollama':
    default:
      return await ollamaGenerate(prompt);
  }
}
