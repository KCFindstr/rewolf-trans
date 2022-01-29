import * as path from 'path';
import { BufferStream } from '../buffer-stream';
import { CTX, WOLF_DAT } from '../constants';
import { forceWriteFile } from '../util';
import { FileCoder } from './file-coder';
import { IProjectData } from '../interfaces';
import { WolfArchive } from './wolf-archive';
import { WolfType } from './wolf-type';
import { TranslationDict } from '../translation/translation-dict';
import { WolfContext } from './wolf-context';
import { ContextBuilder } from '../translation/context-builder';
import { escapePath } from '../translation/string-utils';
import { PathResolver } from './path-resolver';

export class WolfDatabase extends WolfArchive implements IProjectData {
  protected project_: FileCoder;
  protected types_: WolfType[];
  protected unknownEncrypted1_: number;
  protected cryptHeader_: Buffer;

  override get isValid() {
    return super.isValid && this.project_.isValid;
  }

  get projectFilename(): string {
    return this.project_.filename;
  }

  get isEncrypted(): boolean {
    return this.file_.isEncrypted;
  }

  constructor(projectFile: string, dataFile: string) {
    super(dataFile, WOLF_DAT.SEED_INDICES);
    this.project_ = new FileCoder(projectFile);
  }

  readData(_file: FileCoder): void {
    throw new Error('Use WolfDatabase.parse to read data');
  }

  serializeData(stream: BufferStream): void {
    if (this.isEncrypted) {
      stream.appendByte(this.unknownEncrypted1_);
    } else {
      stream.appendBuffer(WOLF_DAT.HEADER);
    }
    stream.appendCustomArray(this.types_, (stream, type) =>
      type.serializeData(stream),
    );
    stream.appendByte(WOLF_DAT.END);
  }

  serializeProject(stream: BufferStream): void {
    stream.appendCustomArray(this.types_, (stream, type) => {
      type.serializeProject(stream);
    });
  }

  override parse(): void {
    // Read project
    const projTypesCount = this.project_.readUIntLE();
    this.types_ = [];
    for (let i = 0; i < projTypesCount; i++) {
      this.types_.push(new WolfType(this.project_));
    }

    // Read data
    if (this.isEncrypted) {
      this.unknownEncrypted1_ = this.file_.readByte();
    } else {
      this.file_.expect(WOLF_DAT.HEADER);
    }
    const datTypesCount = this.file_.readUIntLE();
    this.file_.assert(
      datTypesCount === projTypesCount,
      `Type count mismatch: dat:${datTypesCount} != proj:${projTypesCount}`,
    );
    this.types_.forEach((type) => type.readData(this.file_));
    if (this.file_.readByte() !== WOLF_DAT.END) {
      this.file_.info(`No ${WOLF_DAT.END} found at end of dat`);
    }
  }

  write(pathResolver: PathResolver): void {
    const projectStream = new BufferStream();
    const dataStream = new BufferStream();
    this.serializeProject(projectStream);
    this.serializeData(dataStream);
    const projectBuffer = projectStream.buffer;
    const dataBuffer = this.file_.crypko.encrypt(dataStream.buffer);
    forceWriteFile(
      pathResolver.translatePath(this.projectFilename),
      projectBuffer,
    );
    forceWriteFile(pathResolver.translatePath(this.filename), dataBuffer);
  }

  override generatePatch(dict: TranslationDict): void {
    const pathInfo = path.parse(this.file_.filename);
    const patchPath = path.join(pathInfo.dir, pathInfo.name);
    const relativeFile = WolfContext.pathResolver.relativePath(patchPath);
    const ctxBuilder = new ContextBuilder(relativeFile, CTX.STR.DB);
    ctxBuilder.enter(pathInfo.name);
    for (let i = 0; i < this.types_.length; i++) {
      const type = this.types_[i];
      ctxBuilder.enter(i, type.name);
      ctxBuilder.patchFile = path.join(
        relativeFile,
        escapePath(type.name.text) + '.txt',
      );
      type.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
    }
    ctxBuilder.leave(pathInfo.name);
  }
}
