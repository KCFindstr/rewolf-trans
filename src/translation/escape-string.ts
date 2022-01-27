const SEPARATOR = '/';

export function escapeMultiline(str: string) {
  return str.replace(/\r/g, '\\r');
}

export function unescapeMultiline(str: string) {
  return str.replace(/\\r/g, '\r');
}

export function escapeString(str: string): string {
  const strArr = [];
  for (const char of str) {
    if (char === '\n') {
      strArr.push('\\n');
    } else if (char === '\r') {
      strArr.push('\\r');
    } else if (char === '\t') {
      strArr.push('\\t');
    } else if (char === SEPARATOR) {
      strArr.push('\\' + SEPARATOR);
    } else if (char === '\\') {
      strArr.push('\\\\');
    } else {
      strArr.push(char);
    }
  }
  return strArr.join('');
}

export function unescapeString(str: string): string {
  const strArr = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '\\') {
      const nextChar = str[++i];
      if (nextChar === 'n') {
        strArr.push('\n');
      } else if (nextChar === 'r') {
        strArr.push('\r');
      } else if (nextChar === 't') {
        strArr.push('\t');
      } else if (nextChar === SEPARATOR) {
        strArr.push(SEPARATOR);
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

export function safeJoin(arr: string[]): string {
  return arr.map(escapeString).join(SEPARATOR);
}

export function safeSplit(str: string): string[] {
  const ret: string[] = [];
  let last = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
      continue;
    }
    if (str[i] === SEPARATOR) {
      ret.push(str.substring(last, i));
      last = i + 1;
    }
  }
  ret.push(str.substring(last));
  return ret.map(unescapeString);
}

export function escapePath(str: string) {
  return str.replace(/[\0/\\?%*:|"<>]/g, '');
}

export function isTranslatable(str: string) {
  return str.trim().length > 0;
}
