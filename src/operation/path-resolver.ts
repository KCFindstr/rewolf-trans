import * as path from 'path';

export class PathResolver {
  constructor(public fromDir: string, public toDir?: string) {}

  relativeFrom(absolutePath: string) {
    return path.relative(this.fromDir, absolutePath);
  }

  relativeTo(absolutePath: string) {
    return path.relative(this.toDir, absolutePath);
  }

  absoluteFrom(relativePath: string) {
    return path.join(this.fromDir, relativePath);
  }

  absoluteTo(relativePath: string) {
    return path.join(this.toDir, relativePath);
  }

  relativePath(absolutePath: string) {
    return this.relativeFrom(absolutePath);
  }

  patchPath(relativePath: string) {
    return this.absoluteTo(relativePath);
  }

  originalPath(relativePath: string) {
    return this.absoluteFrom(relativePath);
  }

  translatePath(absoluteInFrom: string) {
    return this.absoluteTo(this.relativeFrom(absoluteInFrom));
  }

  remapPath(absoluteInTo: string) {
    return this.absoluteFrom(this.relativeTo(absoluteInTo));
  }
}
