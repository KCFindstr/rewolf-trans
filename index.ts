import * as commandLineArgs from 'command-line-args';
import { extract } from './src/operation/extract';

async function main() {
  const options = commandLineArgs([
    { name: 'extract', alias: 'x', type: String },
    { name: 'patch', alias: 'p', type: String },
    { name: 'encoding', alias: 'e', type: String },
  ]);
  if (options.extract && options.patch) {
    console.error('Cannot both extract and patch.');
    return;
  }
  const encoding = options.encoding || 'SHIFT_JIS';
  try {
    if (options.extract) {
      extract(options.extract, encoding);
    } else if (options.patch) {
    } else {
      console.error('Must specify either --extract or --patch.');
      return;
    }
  } catch (e) {
    console.error(e.stack || e);
  }
}

if (require.main === module) {
  void main();
}

export { extract };
