serial-rename
==============

Rename files

## Install
```
npm install serial-rename -g
```

## Usage
```
$ serial-rename -h

  Usage: index [options]

  serial-rename: rename files

  Options:

    -V, --version                                      output the version number
    -d, --source_dir <string>                          source dir
    -m, --source_mode <NORMAL|SUB>, default is NORMAL  source modes:
        SUB: read all files of specified dir's sub dirs, and rename them
        NORMAL: read all files of specified dir, and rename them
    -o, --output_dir <dir>                             output directory
    -n, --start_number <num>                           rename start number, default is 0
    -N, --output_name <string>                         output basename, optional, default is renamed_
    -l, --locale <string>                              locale by which file list read from dir sorted, default is en, see https://www.npmjs.com/package/readdir-sorted
    -h, --help                                         output usage information
```