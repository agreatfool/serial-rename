#!/usr/bin/env node
import * as LibFs from 'fs/promises';
import * as LibPath from 'path';
import { Command } from 'commander';
import * as readdirSorted from 'readdir-sorted';

const pkg = require('../package.json');
const MODES = ['NORMAL', 'SUB'];
const BASE_NAME = 'renamed_';

const program = new Command();
program.version(pkg.version)
    .description('serial-rename: rename files')
    .requiredOption('-d, --source_dir <string>', 'source dir')
    .option(
        `-m, --source_mode <${MODES.join('|')}>, default is ${MODES[1]}`,
        'source modes:\n' +
        '\tSUB: read all files of specified dir\'s sub dirs, and rename them\n' +
        '\tNORMAL: read all files of specified dir, and rename them', MODES[1]
    )
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

    private _num: number = 0;

    constructor(start: number) {
        this._num = start;
    }

    public async run() {
        console.log('Rename starting ...');

        await this._validate();
        await this._process();
    }

    private async _validate() {
        // -d source_dir
        if (ARGS_SOURCE_DIR === undefined) {
            console.log('Source directory required, please provide -d option');
            process.exit(1);
        }
        if (!(await LibFs.stat(ARGS_SOURCE_DIR)).isDirectory()) {
            console.log('Valid source directory required, please check -d option');
            process.exit(1);
        }

        // -o output_dir
        if (ARGS_OUTPUT_DIR === undefined) {
            console.log('Output directory required, please provide -o option');
            process.exit(1);
        }
        if (!(await LibFs.stat(ARGS_OUTPUT_DIR)).isDirectory()) {
            console.log('Valid output directory required, please check -o option');
            process.exit(1);
        }
    }

    private async _process() {
        return this._processDir(ARGS_SOURCE_DIR);
    }

    private async _processDir(path: string) {
        console.log(`Dir: ${path}`);
        const dirFiles = await readdirSorted(path, {
            locale: ARGS_LOCALE,
            numeric: true
        });
        for (const dirFile of dirFiles) {
            if (dirFile === '.DS_Store') {
                continue;
            }
            const absPath = LibPath.join(path, dirFile);
            const stat = await LibFs.stat(absPath);
            if (stat.isFile()) {
                await this._processFile(absPath);
            } else {
                if (ARGS_SOURCE_MODE === MODES[0]) {
                    // mode "NORMAL", no sub dirs
                    continue;
                }
                await this._processDir(absPath);
            }
        }
    }

    private async _processFile(filePath: string) {
        console.log(`File: ${filePath}`);
        if (!(await LibFs.stat(filePath)).isFile()) {
            return;
        }

        const parsed = LibPath.parse(filePath);
        const destPath = LibPath.join(ARGS_OUTPUT_DIR, `${ARGS_OUTPUT_NAME}${this._padNumLeft0(this._num, ARGS_COUNT_LENGTH)}${parsed.ext}`);
        await LibFs.copyFile(filePath, destPath);

        this._num++;
    }

    private _padNumLeft0(num: number, length: number): string {
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
