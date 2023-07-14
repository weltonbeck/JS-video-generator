import { Configuration, OpenAIApi } from 'openai';

export default class OpenAIService {
  openai: OpenAIApi | null = null;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async run(prompt: string): Promise<string | null> {
    let output = null;
    if (this.openai) {
      try {
        const completion = await this.openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
        if (completion.data.choices[0].message?.content) {
          output = completion.data.choices[0].message?.content;
        }
      } catch (error) {
        throw new Error('Erro no request do openai');
      }
    } else {
      throw new Error('openai não inicializada');
    }
    return output;
  }
}
