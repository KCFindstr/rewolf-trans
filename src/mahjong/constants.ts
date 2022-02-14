const MC_DAT_HEADER = Buffer.alloc(16);
MC_DAT_HEADER.write('CLS_FILELINK');
const MC_TEX_HEADER = Buffer.alloc(16);
MC_TEX_HEADER.write('CLS_TEXFILE');
const MC_MBT_HEADER = Buffer.from('MBT0');

enum MC_PATCH_TYPE {
  TEX = 'TEX',
  SCENE = 'SCENE',
}

export { MC_DAT_HEADER, MC_TEX_HEADER, MC_MBT_HEADER, MC_PATCH_TYPE };
