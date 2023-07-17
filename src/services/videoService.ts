import Jimp from 'jimp';
import ffmpeg from 'fluent-ffmpeg';
import cacheHelper from '../helpers/cacheHelper';

export default class VideoService {
  splitter(str: string, l: number) {
    let value = str;
    const output = [];
    while (value.length > l) {
      let pos = value.substring(0, l).lastIndexOf(' ');
      pos = pos <= 0 ? l : pos;
      output.push(value.substring(0, pos));
      let i = value.indexOf(' ', pos) + 1;
      if (i < pos || i > pos + l) i = pos;
      value = value.substring(i);
    }
    output.push(value);
    return output.join(`\n`);
  }

  promiseGenerate(
    image: string,
    audio: string,
    text: string,
    file: string,
  ): Promise<string | null> {
    const path = cacheHelper.getFilePath(`videos/${file}.mp4`);
    return new Promise(resolve => {
      ffmpeg()
        .addInput(image)
        .addInput(audio)
        .videoCodec('libx264')
        .withAudioCodec('aac')
        .format('mp4')
        .outputOptions('-pix_fmt yuv420p')
        .withVideoFilters([
          {
            filter: 'drawtext',
            options: {
              fontfile: '../Roboto-Regular.ttf',
              text: this.splitter(
                text
                  .replaceAll(`'`, ``)
                  .replaceAll(`"`, ``)
                  .replaceAll(`:`, ` - `),
                40,
              ),
              fontsize: 22,
              line_spacing: 10,
              fontcolor: 'white',
              x: '(main_w/2-text_w/2)',
              y: '(main_h/2-text_h/2)',
              shadowcolor: 'black',
              shadowx: 2,
              shadowy: 2,
              box: 1,
              boxcolor: 'black@0.5',
              boxborderw: 30,
            },
          },
        ])
        .saveToFile(path)
        .on('error', err => {
          console.error('Error:', err);
          resolve(null);
        })
        .on('end', () => {
          resolve(path);
        });
    });
  }

  promiseMerge(files: (string | null)[], file: string) {
    const path = cacheHelper.getFilePath(`${file}.mp4`);
    return new Promise(resolve => {
      const video = ffmpeg();
      files.forEach(e => {
        if (e) {
          video.addInput(e);
        }
      });
      video
        .format('mp4')
        .mergeToFile(path, './tmp/')
        .on('error', err => {
          console.error('Error:', err);
          resolve(null);
        })
        .on('end', () => {
          resolve(path);
        });
    });
  }

  async generate(itens: { image: string; audio: string; text: string }[] = []) {
    try {
      // let image = await Jimp.read(cacheHelper.getFilePath(`images/0.jpg`));
      // image.resize(640, 640).write(cacheHelper.getFilePath(`images/0.jpg`));

      const videos = [];
      // eslint-disable-next-line no-restricted-syntax
      for await (const [i, item] of itens.entries()) {
        const data = await this.promiseGenerate(
          item.image,
          item.audio,
          item.text,
          String(i),
        );
        videos.push(data);
      }
      await this.promiseMerge(videos, 'video');
      return videos;
    } catch (error) {
      throw new Error('Erro ao gerar o video');
    }
  }
}
