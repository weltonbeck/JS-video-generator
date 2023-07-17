import { gTTS } from 'simple-gtts';
import cacheHelper from '../helpers/cacheHelper';

export default class GttsService {
  async textToSpeech(
    text: string,
    name: string = 'audio',
    language = 'pt-BR',
  ): Promise<string> {
    try {
      const path = cacheHelper.getFilePath(`audios/${name}.mp3`);
      await gTTS(text, {
        lang: language,
        path,
      });
      return path;
    } catch (error) {
      throw new Error('Erro no request do gtts');
    }
  }
}
