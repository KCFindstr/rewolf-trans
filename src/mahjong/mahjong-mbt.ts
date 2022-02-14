import { FileCoder } from '../archive/file-coder';
import { IAppendContext } from '../interfaces';
import { logger } from '../logger';
import { ContextBuilder } from '../translation/context-builder';
import { TranslationDict } from '../translation/translation-dict';
import { PatchFileCategory } from '../translation/translation-entry';
import { TranslationString } from '../translation/translation-string';
import { MC_MBT_HEADER } from './constants';

class MahjongMBTScene implements IAppendContext {
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

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    dict.addTexts(ctxBuilder, PatchFileCategory.Normal, this.strings);
  }
}

export class MahjongMBT implements IAppendContext {
  numScenes: number;
  numStrings: number; // 1 more than total number of strings in all scenes
  sceneHeaderOffset: number;
  scenes: MahjongMBTScene[];
  stringOffsets: number[]; // Aligned to 4 bytes

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

    file.pushPtr(this.sceneHeaderOffset);
    this.scenes = file.readArray(
      (f) => new MahjongMBTScene(f, this.stringOffsets),
      () => this.numScenes,
    );
    file.popPtr();
  }

  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void {
    this.scenes.forEach((scene, i) => {
      ctxBuilder.enter(i, scene.name);
      scene.appendContext(ctxBuilder, dict);
      ctxBuilder.leave(i);
    });
  }
}
