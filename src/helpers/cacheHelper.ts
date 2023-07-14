import * as fs from 'fs';
import * as path from 'path';

const getFilePath = (filename: string): string => {
  return path.join(__dirname, '../', '../', 'cache', filename);
};

const writeFile = (filename: string, value: string): void => {
  const file = getFilePath(filename);
  fs.writeFileSync(file, value);
};

const readFile = (filename: string) => {
  const file = getFilePath(filename);
  let output = null;
  if (fs.existsSync(file)) {
    output = fs.readFileSync(file, 'utf8');
  }
  return output;
};

export default {
  getFilePath,
  writeFile,
  readFile,
};
