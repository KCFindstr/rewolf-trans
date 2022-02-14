import { FileCoder } from '../archive/file-coder';
import { logger } from '../logger';
import { TranslationString } from '../translation/translation-string';
import { MC_MBT_HEADER } from './constants';

class MahjongMBTScene {
  startIndex: number;
  numStrings: number;
  nameOffset: number;
  name: string;
  stringOffsets: number[] = [];
  strings: TranslationString[]; // Last string is always empty

  constructor(file: FileCoder, stringOffsets: number[]) {
    this.startIndex = file.readUIntLE();
    this.numStrings = file.readUIntLE();
    this.nameOffset = file.readUIntLE();
    file.pushPtr(this.nameOffset);
    this.name = file.readStringUnsafe();
    file.popPtr();
    logger.debug(`Scene: ${this.name} has ${this.numStrings} strings`);
    this.stringOffsets = stringOffsets.slice(
      this.startIndex,
      this.startIndex + this.numStrings,
    );
    this.strings = this.stringOffsets.map((offset) => {
      file.pushPtr(offset);
      const str = file.readTStringUnsafe();
      file.popPtr();
      return str;
    });
  }
}

export class MahjongMBT {
  numScenes: number;
  numStrings: number; // 1 more than total number of strings in all scenes
  sceneHeaderOffset: number;
  scenes: MahjongMBTScene[];
  stringOffsets: number[];

  constructor(file: FileCoder) {
    file.expect(MC_MBT_HEADER);
    this.numScenes = file.readUIntLE();
    this.numStrings = file.readUIntLE();
    this.sceneHeaderOffset = file.readUIntLE();
    logger.debug(
      `# Scenes: ${this.numScenes}, # Strings: ${
        this.numStrings
      }, scene header offset = ${this.sceneHeaderOffset.toString(16)}`,
    );
    this.stringOffsets = file.readUIntLEArray(() => this.numStrings);
    this.stringOffsets.forEach((offset, i) => {
      logger.debug(`String ${i} offset: ${offset.toString(16)}`);
    });

    file.pushPtr(this.sceneHeaderOffset);
    this.scenes = file.readArray(
      (f) => new MahjongMBTScene(f, this.stringOffsets),
      () => this.numScenes,
    );
    file.popPtr();
  }
}
