import { WolfData, WolfField, WolfType } from '../archive/wolf-type';
import { CTX } from '../constants';
import { safeJoin } from './string-utils';
import { TranslationContext } from './translation-context';

export class DatabaseContext extends TranslationContext {
  constructor(
    public dbName: string,
    public typeIndex: number,
    public typeName: string,
    public datumIndex: number,
    public datumName: string,
    public fieldIndex: number,
    public fieldName: string,
  ) {
    super();
  }

  override get key(): string {
    return safeJoin([
      CTX.NUM.DB,
      this.dbName,
      this.typeIndex,
      this.datumIndex,
      this.fieldIndex,
    ]);
  }

  override toString(): string {
    return `${CTX.STR.DB}:${safeJoin([
      this.dbName,
      `[${this.typeIndex}]${this.typeName}`,
      `[${this.datumIndex}]${this.datumName}`,
      `[${this.fieldIndex}]${this.fieldName}`,
    ])}`;
  }

  static FromData(
    dbName: string,
    typeIndex: number,
    type: WolfType,
    datumIndex: number,
    datum: WolfData,
    field: WolfField,
  ) {
    return new DatabaseContext(
      dbName,
      typeIndex,
      type.name,
      datumIndex,
      datum.name,
      field.index,
      field.name,
    );
  }

  static FromPath(path: string[]): DatabaseContext {
    if (path.length !== 4) {
      throw new Error(`Invalid Database path: ${path}`);
    }
    const dbName = path[0];
    const indices: number[] = [];
    const names: string[] = [];
    for (let i = 1; i < path.length; i++) {
      const part = path[i];
      const match = part.match(/^\[(\d+)\](.*)$/s);
      if (!match) {
        throw new Error(`Invalid Database path: ${path}`);
      }
      indices.push(parseInt(match[1], 10));
      names.push(match[2]);
    }
    return new DatabaseContext(
      dbName,
      indices[0],
      names[0],
      indices[1],
      names[1],
      indices[2],
      names[2],
    );
  }
}
