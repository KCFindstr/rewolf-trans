import { IGeneratePatch, IWriteData } from '../interfaces';
import { TranslationDict } from '../translation/translation-dict';
import { FileCoder } from '../archive/file-coder';
import { PathResolver } from './path-resolver';

export abstract class WolfArchive implements IGeneratePatch, IWriteData {
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

  abstract write(pathResolver: PathResolver): void;
  abstract parse(): void;
  abstract generatePatch(dict: TranslationDict): void;
}
