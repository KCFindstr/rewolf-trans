import { IGeneratePatch } from '../interfaces';
import { TranslationDict } from '../translation/translation-dict';
import { FileCoder } from './file-coder';

export abstract class WolfArchive implements IGeneratePatch {
  protected file_: FileCoder;

  constructor(filename: string, seedIndices?: number[]) {
    this.file_ = new FileCoder(filename, seedIndices);
  }

  get buffer() {
    return this.file_.buffer;
  }

  get filename() {
    return this.file_.filename;
  }

  get isValid() {
    return this.file_.isValid;
  }

  abstract parse(): void;
  abstract generatePatch(dict: TranslationDict): void;
}
