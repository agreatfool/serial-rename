#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const LibFs = require("fs/promises");
const LibPath = require("path");
const commander_1 = require("commander");
const readdirSorted = require("readdir-sorted");
const pkg = require('../package.json');
const MODES = ['NORMAL', 'SUB'];
const BASE_NAME = 'renamed_';
const program = new commander_1.Command();
program.version(pkg.version)
    .description('serial-rename: rename files')
    .requiredOption('-d, --source_dir <string>', 'source dir')
    .option(`-m, --source_mode <${MODES.join('|')}>, default is ${MODES[1]}`, 'source modes:\n' +
    '\tSUB: read all files of specified dir\'s sub dirs, and rename them\n' +
    '\tNORMAL: read all files of specified dir, and rename them', MODES[1])
    .requiredOption('-o, --output_dir <dir>', 'output directory')
    .option('-n, --start_number <num>', 'rename start number, default is 0', '0')
    .option('-N, --output_name <string>', `output basename, optional, default is ${BASE_NAME}`, BASE_NAME)
    .option('-c, --count_length <num>', 'output file name count length, e.g 3 => 001, 4 => 0001, default is 4', '4')
    .option('-l, --locale <string>', 'locale by which file list read from dir sorted, default is en, see https://www.npmjs.com/package/readdir-sorted', 'en')
    .parse(process.argv);
const options = program.opts();
const ARGS_SOURCE_DIR = options.source_dir;
const ARGS_SOURCE_MODE = options.source_mode;
const ARGS_OUTPUT_DIR = options.output_dir;
const ARGS_START_NUM = options.start_number === undefined ? 0 : parseInt(options.start_number);
const ARGS_OUTPUT_NAME = options.output_name;
const ARGS_COUNT_LENGTH = options.count_length === undefined ? 4 : parseInt(options.count_length);
const ARGS_LOCALE = options.locale;
console.log(options);
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
            if (!(yield LibFs.stat(ARGS_SOURCE_DIR)).isDirectory()) {
                console.log('Valid source directory required, please check -d option');
                process.exit(1);
            }
            // -o output_dir
            if (ARGS_OUTPUT_DIR === undefined) {
                console.log('Output directory required, please provide -o option');
                process.exit(1);
            }
            if (!(yield LibFs.stat(ARGS_OUTPUT_DIR)).isDirectory()) {
                console.log('Valid output directory required, please check -o option');
                process.exit(1);
            }
        });
    }
    _process() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._processDir(ARGS_SOURCE_DIR);
        });
    }
    _processDir(path) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Dir: ${path}`);
            const dirFiles = yield readdirSorted(path, {
                locale: ARGS_LOCALE,
                numeric: true
            });
            for (const dirFile of dirFiles) {
                if (dirFile === '.DS_Store') {
                    continue;
                }
                const absPath = LibPath.join(path, dirFile);
                const stat = yield LibFs.stat(absPath);
                if (stat.isFile()) {
                    yield this._processFile(absPath);
                }
                else {
                    if (ARGS_SOURCE_MODE === MODES[0]) {
                        // mode "NORMAL", no sub dirs
                        continue;
                    }
                    yield this._processDir(absPath);
                }
            }
        });
    }
    _processFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`File: ${filePath}`);
            if (!(yield LibFs.stat(filePath)).isFile()) {
                return;
            }
            const parsed = LibPath.parse(filePath);
            const destPath = LibPath.join(ARGS_OUTPUT_DIR, `${ARGS_OUTPUT_NAME}${this._padNumLeft0(this._num, ARGS_COUNT_LENGTH)}${parsed.ext}`);
            yield LibFs.copyFile(filePath, destPath);
            this._num++;
        });
    }
    _padNumLeft0(num, length) {
        // (5, 4) => '0005'
        let str = String(num);
        const gap = length - str.length;
        if (gap > 0) {
            str = new Array(gap + 1).join('0') + str;
        }
        return str;
    }
}
new SerialRename(ARGS_START_NUM).run().then(_ => _).catch(_ => console.log(_));
process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});
process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error}`);
});
//# sourceMappingURL=index.js.map