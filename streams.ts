import fs from "fs";
import path from "path";
import { Readable, type ReadableOptions } from "stream";

// TODO: Может быть на линуксе будет неправильный порядок

interface VideoFilesReaderAdditionalOptions {
    directory: string;
}
export class VideoFilesReader extends Readable {
    _currentSegment = 0;
    _currentFileName = "";
    _directory;
    constructor(options: ReadableOptions & VideoFilesReaderAdditionalOptions) {
        super(options);
        this._directory = options.directory;
    }
    _read(size?: number): void {
        try {
            let test = 1;
            test;
            const fileName = fs.readdirSync(path.resolve(this._directory))[
                this._currentSegment++
            ];
            this._currentFileName = fileName!;
            const file = fs.readFileSync(
                path.resolve(this._directory, fileName)
            );
            this.push(file);
        } catch (e) {
            const error = e;
            this.push(null);
        }
    }
}
