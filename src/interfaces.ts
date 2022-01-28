import { BufferStream } from './buffer-stream';
import { FileCoder } from './archive/file-coder';
import { TranslationDict } from './translation/translation-dict';
import { ContextBuilder } from './translation/context-builder';

export interface ISerializable {
  serialize(stream: BufferStream): void;
}

export interface IProjectData {
  readData(file: FileCoder, ...args: any[]): void;
  serializeData(stream: BufferStream): void;
  serializeProject(stream: BufferStream): void;
}

export interface IGeneratePatch {
  generatePatch(dict: TranslationDict): void;
}

export interface IContextSupplier {
  appendContext(ctxBuilder: ContextBuilder, dict: TranslationDict): void;
}

export interface ICustomKey {
  get key(): string;
}

export interface IString {
  toString(): string;
}

export interface ITranslationText {
  getTexts(): string[];
  patchText(index: number, translated: string): void;
}
