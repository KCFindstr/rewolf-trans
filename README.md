# Rewolf-trans

Rewolf-trans is an improved Wolf RPG Editor games translation tool heavily inspired by [Wolf Trans](https://github.com/elizagamedev/wolftrans) and [Translator++](https://dreamsavior.net/translator-plusplus/).

This package is written in [TypeScript](https://www.typescriptlang.org/) and can be installed as a command line tool or a NodeJS dependency.

## Why Rewolf-trans
- Supports reading / writing in custom encoding.
- Better patch file format that uniquely identify string location, which fixes some string locating issue in Wolf Trans.
- More strings extracted and categorized into different patch files based on how risky the tools thinks it is to modify these string.
- Possible to upgrade from existing Wolf Trans patch files.
- Works both as a command line tool and a NodeJS package.
- Extensible design.

## Installation

Install the latest version of [NodeJS](https://nodejs.org/).

## Usage

Use `npx rewolf-trans <args>` to run this tool. Notice that this package will be installed when you run the command for the first time, and therefore might take longer than usual.

### Parameters
This parameters might appear later in this doc without being explained again.
- `<game root directory>`: The root directory of the game you want to translate. This is where `Game.exe` lives.
- `<patch directory>`: The directory where you want to locate the patch files.
- `<output directory>`: The directory where you want to pack the translated game files.
- `<source directory>`: The directory where extra patch files are located. In principle this directory is readonly but please backup to be extra careful.

### Extract Patch

Extract patch files to `<patch directory>/rewt-patch`. Existing files might be overwritten, so please backup them first or avoid using your working directory.

```bash
npx rewolf-trans --extract --root <game root directory> --patch <patch directory>
```

### Generate Patch

In addition to `--extract`, it takes in another parameter `<source directory>`. When generating patch files, the tool will try to read all existing patch files in `<source directory>` and write any changes or translations to the generated files.

This is very helpful when you want to upgrade from exsiting Wolf Trans patch files, since this tool tries to be compatible when reading (but not writing!) the Wolf Trans patch file format. However, due to some differences in implementation, some data might fail to upgrade, which will be logged.

```bash
npx rewolf-trans --generate --root <game root directory> --patch <patch directory> --source <source directory>
```

### Apply Patch
Reads all patch files from `<patch directory>/rewt-patch` and writes patched game data files to `<output directory>/rewt-out`.

**Warning**: The output directory will be recursively removed if it exists.

```bash
npx rewolf-trans --apply --root <game root directory> --patch <patch directory> --output <output directory>
```

### Specify Encoding
By default, the tool reads SHIFT_JIS and writes GBK. To change this, append `--renc <encoding>` (read encoding) and `--wenc <encoding>` (write encoding) to these commands.  See [here](https://www.npmjs.com/package/iconv-lite#supported-encodings) for the list of supported encodings.

### Verbose Logging
Add the flag `--verbose` to enable verbose logging.

## Other Topics
### Patch Format
Although very similar, this tool uses a different patch file format than Wolf Trans does, which are incompatible with each other. See sections above if you want to upgrade Wolf Trans patch files to Reworl-trans patch files. However there's no way back.

### Translating Context
If you translate context strings, they should be applied to game data. This is implemented but has not been tested yet.

### Dangerous Strings
One major difference is that this tool exposes some dangerous strings such as Database Commands and string arguments. Although some of them should be translated, modifying others might break the game. Translation texts will be written to separate patch files according to how risky it is to modify these strings, but if you see mixed contexts and only want to translate some of them, try manually separating contexts into different `> BEGIN STRING` and `> END STRING` blocks.

## Disclaimer
1. This tool might not work with all the games, and please submit an issue if it does not work / misses texts that should be translated / has weird behavior. Verbose debug logs will be helpful. But it's not ganranteed that I will have capacity to investigate the issue.
2. Avoid modifying the original patch files, as they might be overwritten if you run this tool again. Backup your translation frequently. The author is not responsible for any damage or copyright infringement caused by users using this tool.