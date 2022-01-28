export class TranslationString {
  constructor(public text: string, public isTranslated: boolean = false) {}

  patch(translated: string) {
    this.text = translated;
    this.isTranslated = true;
  }

  public static FromRawStr(str: string): TranslationString {
    return new TranslationString(str);
  }

  public static FromRawStrs(strs: string[]): TranslationString[] {
    return strs.map(TranslationString.FromRawStr);
  }
}
