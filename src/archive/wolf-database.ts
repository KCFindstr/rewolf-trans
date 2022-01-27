import * as fs from 'fs';
import * as path from 'path';
import { BufferStream } from '../buffer-stream';
import { WOLF_DAT } from '../constants';
import { ensureDir } from '../util';
import { FileCoder } from './file-coder';
import { IProjectData } from '../interfaces';
import { WolfArchive } from './wolf-archive';
import { WolfType } from './wolf-type';
import { TranslationDict } from '../translation/translation-dict';

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
      this.file_.log(`No ${WOLF_DAT.END} found at end of dat`);
    }
  }

  write(projectPath: string, dataPath: string): void {
    const projectStream = new BufferStream();
    const dataStream = new BufferStream();
    this.serializeProject(projectStream);
    this.serializeData(dataStream);
    const projectBuffer = projectStream.buffer;
    const dataBuffer = this.file_.crypko.encrypt(dataStream.buffer);
    ensureDir(path.dirname(projectPath));
    fs.writeFileSync(projectPath, projectBuffer);
    ensureDir(path.dirname(dataPath));
    fs.writeFileSync(dataPath, dataBuffer);
  }

  override generatePatch(_dict: TranslationDict): void {
    throw new Error('Method not implemented.');
  }
}
