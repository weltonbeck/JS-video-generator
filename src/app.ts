import 'dotenv/config';
import cacheHelper from './helpers/cacheHelper';
import OpenAIService from './services/openAIService';
import GttsService from './services/gttsService';

interface videoJsonData {
  fulltext: string;
  phrases?: {
    text: string;
    searchTerm: string | null;
    image: string | null;
    audio: string | null;
  }[];
}

const generateScript = async (
  openAIService: OpenAIService,
  term: string,
): Promise<videoJsonData | null> => {
  let data: videoJsonData | null = null;
  const result = await openAIService.run(term);
  if (result) {
    data = {
      fulltext: result
        ?.split('\n')
        .filter(e => e.length > 1)
        .join('\n'),
    };
    cacheHelper.writeFile('video.json', JSON.stringify(data));
  }
  return data;
};

const getSearchTerms = async (
  openAIService: OpenAIService,
  result: videoJsonData | null,
): Promise<videoJsonData | null> => {
  const output = result;
  if (output && result && result.fulltext) {
    const phrases = result.fulltext?.split('\n').filter(e => e.length > 1);
    if (phrases) {
      const data = await openAIService.run(
        `leia o texto a seguir :

            ${phrases.join('\n')}

           baseado no texto acima me responda bons termos para busca de imagens, quero uma respota curta com no maximo 3 palavras para cada um dos ${
             phrases.length
           } paragrafos, cada resposta em uma linha`,
      );

      if (data) {
        const imageTerms = data.split('\n').filter(e => e.length > 1);
        if (imageTerms.length >= phrases.length) {
          output.phrases = phrases.map((e, index) => {
            return {
              text: e,
              searchTerm: imageTerms[index] || null,
              image: null,
              audio: null,
            };
          });
          cacheHelper.writeFile('video.json', JSON.stringify(output));
        } else {
          throw new Error('resultados dos termos invalido');
        }
      }
    }
  }
  return output;
};

const getAudios = async (
  gttsService: GttsService,
  result: videoJsonData | null,
): Promise<videoJsonData | null> => {
  const output = result;
  if (
    output &&
    output.phrases &&
    result &&
    result.phrases &&
    result.phrases.length > 0
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const [i, phrase] of result.phrases.entries()) {
      output.phrases[i].audio = await gttsService.textToSpeech(
        phrase.text,
        String(i),
      );
    }
  }
  return output;
};

const runApp = async () => {
  const openAIService = new OpenAIService();
  const gttsService = new GttsService();
  let result: videoJsonData | null = null;

  // read json from folder
  // const resultTmp = cacheHelper.readFile('video.json');
  // if (resultTmp) {
  //   result = JSON.parse(resultTmp);
  // }

  result = await generateScript(
    openAIService,
    'se comporte como um youtuber e me entregue um video de 5 minutos, sobre curiosidades sobre cachorros',
  );
  result = await getSearchTerms(openAIService, result);
  result = await getAudios(gttsService, result);

  console.log(result);
};

runApp();
