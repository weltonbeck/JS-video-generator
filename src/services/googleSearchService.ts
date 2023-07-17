import { google } from 'googleapis';
import imageDownloader from 'image-downloader';
import Jimp from 'jimp';
import cacheHelper from '../helpers/cacheHelper';

const customSearch = google.customsearch('v1');

export default class GoogleSearchService {
  async searchImage(query: string): Promise<string[]> {
    const response = await customSearch.cse.list({
      auth: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_SEARCH_ID,
      q: query,
      searchType: 'image',
      imgSize: 'large',
      num: 3,
      safe: 'active',
      rights: 'cc_publicdomain, cc_attribute, cc_sharealike, cc_nonderived',
    });
    let imagesUrl: string[] = [];
    if (response && response.data && response.data.items) {
      imagesUrl = response.data.items
        .filter(item =>
          ['image/jpeg', 'image/png'].includes(String(item.fileFormat)),
        )
        .map(item => {
          return String(item.link);
        });
    }
    return imagesUrl;
  }

  async saveImage(url: string, fileName: string) {
    const extension = url.split('.').pop()?.substring(0, 3);
    const imagePath = cacheHelper.getFilePath(
      `images/${fileName}.${extension}`,
    );
    await imageDownloader.image({
      url,
      dest: imagePath,
    });
    const image = await Jimp.read(imagePath);
    image.resize(640, 640).write(imagePath);
    return imagePath;
  }

  async getImage(query: string, fileName: string) {
    let imagePath = null;
    try {
      const images = await this.searchImage(query);
      if (images.length > 0) {
        imagePath = await this.saveImage(images.reverse()[0], fileName);
      }
    } catch (error) {
      //
    }
    return imagePath;
  }
}
