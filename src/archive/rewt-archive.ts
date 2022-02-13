import { ICrypko, IGeneratePatch, IWriteData } from '../interfaces';
import { TranslationDict } from '../translation/translation-dict';
import { FileCoder } from './file-coder';
import { PathResolver } from '../operation/path-resolver';

export abstract class RewtArchive implements IGeneratePatch, IWriteData {
  protected file_: FileCoder;

  constructor(filename: string, crypko?: ICrypko) {
    this.file_ = new FileCoder(filename, crypko);
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
  abstract generatePatch(
    pathResolver: PathResolver,
    dict: TranslationDict,
  ): void;
}
