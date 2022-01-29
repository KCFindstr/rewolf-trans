import { IString } from '../interfaces';

const SEPARATOR = '/';
const MULTILINE_ESCAPE = '>#';

export function escapeString(
  str: string,
  escapeChars: string = SEPARATOR,
  escapeNewline = true,
): string {
  const strArr = [];
  for (const char of str) {
    if (char === '\n') {
      strArr.push(escapeNewline ? '\\n' : '\n');
    } else if (char === '\0') {
      strArr.push('\\0');
    } else if (char === '\r') {
      strArr.push('\\r');
    } else if (char === '\t') {
      strArr.push('\\t');
    } else if (escapeChars.includes(char)) {
      strArr.push('\\' + char);
    } else if (char === '\\') {
      strArr.push('\\\\');
    } else {
      strArr.push(char);
    }
  }
  return strArr.join('');
}

export function unescapeString(
  str: string,
  escapeChars: string = SEPARATOR,
): string {
  const strArr = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '\\') {
      const nextChar = str[++i];
      if (nextChar === 'n') {
        strArr.push('\n');
      } else if (nextChar === '0') {
        strArr.push('\0');
      } else if (nextChar === 'r') {
        strArr.push('\r');
      } else if (nextChar === 't') {
        strArr.push('\t');
      } else if (escapeChars.includes(nextChar)) {
        strArr.push(nextChar);
      } else if (nextChar === '\\') {
        strArr.push('\\');
      } else {
        strArr.push(char);
      }
    } else {
      strArr.push(char);
    }
  }
  return strArr.join('');
}

export function safeJoin(arr: IString[], separator = SEPARATOR): string {
  return arr
    .map((item) => escapeString(item.toString(), separator))
    .join(separator);
}

export function safeSplit(str: string, separators = SEPARATOR): string[] {
  const ret: string[] = [];
  let last = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
      continue;
    }
    if (separators.includes(str[i])) {
      ret.push(str.substring(last, i));
      last = i + 1;
    }
  }
  ret.push(str.substring(last));
  return ret.map((str) => unescapeString(str, separators));
}

export function escapePath(str: string) {
  return str.replace(/[\0/\\?%*:|"<>]/g, '');
}
export function escapeMultiline(str: string) {
  str = escapeString(str, MULTILINE_ESCAPE, false);
  const trailingNewLineNum = str.match(/\n*$/s)[0].length;
  str =
    str.substring(0, str.length - trailingNewLineNum) +
    '\\n'.repeat(trailingNewLineNum);
  const trailingSpaceNum = str.match(/ *$/s)[0].length;
  str =
    str.substring(0, str.length - trailingSpaceNum) +
    '\\s'.repeat(trailingSpaceNum);
  return str;
}

export function unescapeMultiline(str: string) {
  const trailingSpaceNum = str.match(/(\\s)*$/s)[0].length;
  str =
    str.substring(0, str.length - trailingSpaceNum) +
    ' '.repeat(trailingSpaceNum / 2);
  str = unescapeString(str, MULTILINE_ESCAPE);
  return str;
}

export function isTranslatable(str: string) {
  return !str.match(/^[\n\t ]*$/s);
}
