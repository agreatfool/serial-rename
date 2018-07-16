#!/usr/bin/env node

import * as LibFs from 'mz/fs';
import * as LibPath from 'path';

import * as program from 'commander';
import * as readdirSorted from 'readdir-sorted';
import {Stats} from "fs";

const pkg = require('../package.json');

const MODES = ['NORMAL', 'SUB'];
const BASE_NAME = 'renamed_';

program.version(pkg.version)
    .description('serial-rename: rename files')
    .option('-d, --source_dir <string>', 'source dir')
    .option(
        `-m, --source_mode <${MODES.join('|')}>, default is ${MODES[0]}`,
        'source modes:\n' +
        '\tSUB: read all files of specified dir\'s sub dirs, and rename them\n' +
        '\tNORMAL: read all files of specified dir, and rename them'
    )
    .option('-o, --output_dir <dir>', 'output directory')
    .option('-n, --start_number <num>', 'rename start number, default is 0', parseInt)
    .option('-N, --output_name <string>', `output basename, optional, default is ${BASE_NAME}`)
    .option('-l, --locale <string>', 'locale by which file list read from dir sorted, default is en, see https://www.npmjs.com/package/readdir-sorted')
    .parse(process.argv);

const ARGS_SOURCE_DIR = (program as any).source_dir === undefined ? undefined : (program as any).source_dir;
const ARGS_SOURCE_MODE = (program as any).source_mode === undefined ? MODES[0] : (program as any).source_mode;
const ARGS_OUTPUT_DIR = (program as any).output_dir === undefined ? undefined : (program as any).output_dir;
const ARGS_START_NUM = (program as any).start_number === undefined ? 0 : (program as any).start_number;
const ARGS_OUTPUT_NAME = !(program as any).output_name ? BASE_NAME : (program as any).output_name;
const ARGS_LOCALE = (program as any).locale === undefined ? 'en' : (program as any).locale;

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
        let sourceStat: Stats = LibFs.statSync(ARGS_SOURCE_DIR);
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
        let destStat: Stats = LibFs.statSync(ARGS_OUTPUT_DIR);
        if (!destStat.isDirectory()) {
            console.log('Valid output directory required, please check -o option');
            process.exit(1);
        }
    }

    private async _process() {
        if (ARGS_SOURCE_MODE === MODES[0]) {
            return await this._processDir();
        }

        const dirFiles = await readdirSorted(ARGS_SOURCE_DIR, {
            locale: ARGS_LOCALE,
            numeric: true
        });

        for (let i = 0; i < dirFiles.length; i++) {
            if (dirFiles[i] === '.DS_Store') {
                continue;
            }

            await this._processDir(dirFiles[i]);
        }
    }

    private async _processDir(path?: string) {
        if (path === undefined) {
            path = '/'; // relative path
        }

        let baseDir = LibPath.join(ARGS_SOURCE_DIR, path);
        console.log(`Processing: ${baseDir}`);
        const dirFiles = await readdirSorted(LibPath.join(ARGS_SOURCE_DIR, path), {
            locale: ARGS_LOCALE,
            numeric: true
        });

        for (let i = 0; i < dirFiles.length; i++) {
            if (dirFiles[i] === '.DS_Store') {
                continue;
            }
            let sourcePath = LibPath.join(baseDir, dirFiles[i]);
            let stat: Stats = LibFs.statSync(sourcePath);
            if (!stat.isFile()) {
                continue;
            }

            let parsed = LibPath.parse(dirFiles[i]);
            let destPath = LibPath.join(ARGS_OUTPUT_DIR, ARGS_OUTPUT_NAME + this._num.toFixed(3) + parsed.ext);

            console.log(`Copy from: ${sourcePath}, to: ${destPath}`);

            LibFs.copyFileSync(sourcePath, destPath);

            this._num++;
        }
    }

}

new SerialRename(ARGS_START_NUM).run().then(_ => _).catch(_ => console.log(_));

process.on('uncaughtException', (error) => {
    console.error(`Process on uncaughtException error = ${error.stack}`);
});

process.on('unhandledRejection', (error) => {
    console.error(`Process on unhandledRejection error = ${error.stack}`);
});