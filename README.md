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

## Change Log
This tool is still in development phase and breaking changes happen. In most cases, you can run a regeneration of the patch files while reading from your working patch files to fix them and keep most of your work unchanged. Please do this ASAP since backward compatibility might get removed in future versions.

***Breaking changes are marked in \* .***

### 0.1.7
- Fixed a bug that caused some strings to be unexpectedly written in write encoding. Because of this, 0.1.6 might be unusable.

### 0.1.6 *
- Wolf command names no longer serve as context key since they do not help with locating the string. A regeneration of patch files is required to fix this while preserving all existing translations.
- Changed command line argument format. If you use a script to generate patch files, please switch to the new format.

### 0.1.5 *
- Changed the way to patch context names. Your already translated context names (but not the content string!) will be lost after regenerating the patch files.

## Installation

Install the latest version of [NodeJS](https://nodejs.org/).

## Usage

Use `npx rewolf-trans <args>` to run this tool. Notice that this package will be installed when you run the command for the first time, and therefore might take longer than usual.

### Parameters
This parameters might appear later in this doc without being explained again.
- `GAME_DIR`: The root directory of the game you want to translate. This is where `Game.exe` lives.
- `PATCH_DIR`: The directory where you want to locate the patch files.
- `OUT_DIR`: The directory where you want to pack the translated game files.
- `SOURCE_DIR`: The directory where extra patch files are located. In principle this directory is readonly but please backup to be extra careful.

### Generate Patch

Generate patch files to `PATCH_DIR/rewt-patch`. Existing files might be overwritten, so please backup them first or avoid using your working directory. If a list of `SOURCE_DIR` is provided, the tool will try to read all existing patch files in `SOURCE_DIR` and write any changes or translations to the generated files.

The optional `SOURCE_DIR` is very helpful when you want to upgrade from exsiting Wolf Trans patch files, since this tool tries to be compatible when reading (but not writing!) the Wolf Trans patch file format. However, due to some differences in implementation, some data might fail to upgrade, which will be logged.

```bash
npx rewolf-trans -r GAME_DIR -p PATCH_DIR generate -s SOURCE_DIR
```

### Apply Patch
Reads all patch files from `PATCH_DIR/rewt-patch` and writes patched game data files to `OUT_DIR/rewt-out`.

**Warning**: The output directory will be recursively removed if it exists.

```bash
npx rewolf-trans -r GAME_DIR -p PATCH_DIR apply -o OUT_DIR
```

### Specify Encoding
By default, the tool reads SHIFT_JIS and writes GBK. To change this, append `--renc <encoding>` (read encoding) and `--wenc <encoding>` (write encoding) to these commands.  See [here](https://www.npmjs.com/package/iconv-lite#supported-encodings) for the list of supported encodings.

**Note**: You must append them before `generate` or `apply`.

### Verbose Logging
Add the flag `--verbose`/`-v` to enable verbose logging.

**Note**: You must append it before `generate` or `apply`.

### Advanced Usage
For additional options, please refer to the command line help by running `npx rewolf-trans -h` or `npx rewolf-trans <command> -h`.

Note that the flags before `<command>` (i.e. `generate` or `apply`) are treated differently. So please pay attention to the order of flags in the above examples.

## Other Topics
### Patch Format
Although very similar, this tool uses a different patch file format than Wolf Trans does, which are incompatible with each other. See sections above if you want to upgrade Wolf Trans patch files to Reworl-trans patch files. However there's no way back.

### Translating Context
**Breaking Change in 0.1.5**: Do not modify strings in `> CONTEXT` lines directly. Instead, look for a patch file with suffix `_Context.txt`. All context strings are stored there, where you can translate as if they are regular texts.

### Dangerous Strings
One major difference is that this tool exposes some dangerous strings such as Database Commands and string arguments. Although some of them should be translated, modifying others might break the game. Translation texts will be written to separate patch files according to how risky it is to modify these strings, but if you see mixed contexts and only want to translate some of them, try manually separating contexts into different `> BEGIN STRING` and `> END STRING` blocks.

## Disclaimer
1. This tool might not work with all the games, and please submit an issue if it does not work / misses texts that should be translated / has weird behavior. Verbose debug logs will be helpful. But it's not guarantee that I will have capacity to investigate the issue.
2. Avoid modifying the original patch files, as they might be overwritten if you run this tool again. Backup your translation frequently. The author is not responsible for any damage or copyright infringement caused by users using this tool.