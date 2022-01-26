import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
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
