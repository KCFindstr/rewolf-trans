import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getFiles(dir: string, recursive = false) {
  const files = fs.readdirSync(dir);
  const result = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (recursive) {
        result.push(...getFiles(filePath, recursive));
      }
    } else {
      result.push(filePath);
    }
  }
  return result;
}

export function bufferStartsWith(buffer: Buffer, start: Buffer) {
  if (buffer.length < start.length) {
    return false;
  }
  for (let i = 0; i < start.length; i++) {
    if (buffer[i] !== start[i]) {
      return false;
    }
  }
  return true;
}

export function bufferEndsWith(buffer: Buffer, end: Buffer) {
  if (buffer.length < end.length) {
    return false;
  }
  for (let i = 0; i < end.length; i++) {
    if (buffer[buffer.length - end.length + i] !== end[i]) {
      return false;
    }
  }
  return true;
}

export function equalsIgnoreCase(str1: string, str2: string) {
  return str1.toLowerCase() === str2.toLowerCase();
}

export function versionStr2Arr(versionStr: string) {
  return versionStr.split('.').map((x) => parseInt(x, 10));
}

/**
 * @returns 1 if lhs > rhs, -1 if lhs < rhs, 0 if lhs == rhs
 */
export function compareVersion(lhs: string | number[], rhs: string | number[]) {
  if (typeof lhs === 'string') {
    lhs = versionStr2Arr(lhs);
  }
  if (typeof rhs === 'string') {
    rhs = versionStr2Arr(rhs);
  }
  const len = Math.min(lhs.length, rhs.length);
  for (let i = 0; i < len; i++) {
    if (lhs[i] > rhs[i]) {
      return 1;
    } else if (lhs[i] < rhs[i]) {
      return -1;
    }
  }
  if (lhs.length !== rhs.length) {
    return lhs.length > rhs.length ? 1 : -1;
  }
  return 0;
}

export function addLeadingChar(
  num: number,
  length: number,
  leadingChar: string,
) {
  const str = leadingChar.repeat(length) + num.toString();
  return str.substring(str.length - length);
}

export function forceWriteFile(
  file: string,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions,
) {
  const dir = path.dirname(file);
  ensureDir(dir);
  fs.writeFileSync(file, data, options);
}
