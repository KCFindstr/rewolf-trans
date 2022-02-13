import * as fs from 'fs';
import { RewtArchive } from '../archive/rewt-archive';
import { PathResolver } from '../operation/path-resolver';
import { logger } from '../logger';
import { TranslationDict } from '../translation/translation-dict';
import { Constructor, getFiles } from '../util';
import { GlobalOptions } from '../operation/options';

export type ArchiveLoadFn = (file: string) => RewtArchive;

export abstract class RewtGame {
  protected archives_: RewtArchive[];
  protected dict_: TranslationDict;

  constructor(protected dataDir_: string) {
    if (!fs.existsSync(dataDir_)) {
      throw new Error(`Directory ${dataDir_} does not exist.`);
    }
    const files = getFiles(this.dataDir_, true);
    this.archives_ = [];
    for (const file of files) {
      const archive = this.loadArchive(file);
      if (archive?.isValid) {
        logger.debug(`Valid archive: ${archive.filename}`);
        this.archives_.push(archive);
      }
    }
  }

  public abstract loadArchive(file: string): RewtArchive;

  public filterArchives<T extends RewtArchive>(type: Constructor<T>): T[] {
    return this.archives_.filter((archive) => archive instanceof type) as T[];
  }

  public get dict() {
    return this.dict_;
  }

  public get archives() {
    return this.archives_;
  }

  public get dataDir() {
    return this.dataDir_;
  }

  public parse() {
    for (const archive of this.archives_) {
      archive.parse();
    }
  }

  public generatePatch() {
    GlobalOptions.pathResolver = new PathResolver(this.dataDir_);
    this.dict_ = new TranslationDict();
    for (const archive of this.archives_) {
      archive.generatePatch(this.dict_);
    }
  }

  public loadPatch(patchDir: string) {
    getFiles(patchDir, true)
      .filter((file) => file.endsWith('.txt'))
      .forEach((file) => this.dict_.load(file));
  }

  public writePatch(patchDir: string) {
    GlobalOptions.pathResolver.toDir = patchDir;
    this.dict_.write();
  }

  public writeData(dataDir: string) {
    GlobalOptions.pathResolver.toDir = dataDir;
    for (const archive of this.archives_) {
      archive.write(GlobalOptions.pathResolver);
    }
  }
}
