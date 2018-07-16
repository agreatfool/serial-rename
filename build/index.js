#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("mz/fs");
const LibPath = require("path");
const program = require("commander");
const readdirSorted = require("readdir-sorted");
const pkg = require('../package.json');
const MODES = ['NORMAL', 'SUB'];
const BASE_NAME = 'renamed_';
program.version(pkg.version)
    .description('serial-rename: rename files')
    .option('-d, --source_dir <string>', 'source dir')
    .option(`-m, --source_mode <${MODES.join('|')}>, default is ${MODES[0]}`, 'source modes:\n' +
    '\tSUB: read all files of specified dir\'s sub dirs, and rename them\n' +
    '\tNORMAL: read all files of specified dir, and rename them')
    .option('-o, --output_dir <dir>', 'output directory')
    .option('-n, --start_number <num>', 'rename start number, default is 0', parseInt)
    .option('-N, --output_name <string>', `output basename, optional, default is ${BASE_NAME}`)
    .option('-l, --locale <string>', 'locale by which file list read from dir sorted, default is en, see https://www.npmjs.com/package/readdir-sorted')
    .parse(process.argv);
const ARGS_SOURCE_DIR = program.source_dir === undefined ? undefined : program.source_dir;
const ARGS_SOURCE_MODE = program.source_mode === undefined ? MODES[0] : program.source_mode;
const ARGS_OUTPUT_DIR = program.output_dir === undefined ? undefined : program.output_dir;
const ARGS_START_NUM = program.start_number === undefined ? 0 : program.start_number;
const ARGS_OUTPUT_NAME = !program.output_name ? BASE_NAME : program.output_name;
const ARGS_LOCALE = program.locale === undefined ? 'en' : program.locale;
class SerialRename {
    constructor(start) {
        this._num = 0;
        this._num = start;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Rename starting ...');
            yield this._validate();
            yield this._process();
        });
    }
    _validate() {
        return __awaiter(this, void 0, void 0, function* () {
            // -d source_dir
            if (ARGS_SOURCE_DIR === undefined) {
                console.log('Source directory required, please provide -d option');
                process.exit(1);
            }
            let sourceStat = LibFs.statSync(ARGS_SOURCE_DIR);
            if (!sourceStat.isDirectory()) {
                console.log('Valid source directory required, please check -d option');
                process.exit(1);
            }
            // -m source_mode
            if (MODES.indexOf(ARGS_SOURCE_MODE) === -1) {
                console.log('Valid source mode required, please check -m option');
                process.exit(1);
            }
            // -o output_dir
            if (ARGS_OUTPUT_DIR === undefined) {
                console.log('Output directory required, please provide -o option');
                process.exit(1);
            }
            let destStat = LibFs.statSync(ARGS_OUTPUT_DIR);
            if (!destStat.isDirectory()) {
                console.log('Valid output directory required, please check -o option');
                process.exit(1);
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            if (ARGS_SOURCE_MODE === MODES[0]) {
                return yield this._processDir();
            }
            const dirFiles = yield readdirSorted(ARGS_SOURCE_DIR, {
                locale: ARGS_LOCALE,
                numeric: true
            });
            for (let i = 0; i < dirFiles.length; i++) {
                if (dirFiles[i] === '.DS_Store') {
                    continue;
                }
                yield this._processDir(dirFiles[i]);
            }
        });
    }
    _processDir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (path === undefined) {
                path = '/'; // relative path
            }
            let baseDir = LibPath.join(ARGS_SOURCE_DIR, path);
            console.log(`Processing: ${baseDir}`);
            const dirFiles = yield readdirSorted(LibPath.join(ARGS_SOURCE_DIR, path), {
                locale: ARGS_LOCALE,
                numeric: true
            });
            for (let i = 0; i < dirFiles.length; i++) {
                if (dirFiles[i] === '.DS_Store') {
                    continue;
                }
                let sourcePath = LibPath.join(baseDir, dirFiles[i]);
                let stat = LibFs.statSync(sourcePath);
                if (!stat.isFile()) {
                    continue;
                }
                let parsed = LibPath.parse(dirFiles[i]);
                let destPath = LibPath.join(ARGS_OUTPUT_DIR, ARGS_OUTPUT_NAME + this._num.toFixed(3) + parsed.ext);
                console.log(`Copy from: ${sourcePath}, to: ${destPath}`);
                LibFs.copyFileSync(sourcePath, destPath);
                this._num++;
            }
        });
    }
}
new SerialRename(ARGS_START_NUM).run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});
//# sourceMappingURL=index.js.map