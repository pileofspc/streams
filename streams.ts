import assert from "assert";
import fs from "fs";
import { Readable, type ReadableOptions } from "stream";

// TODO: Может быть на линуксе будет неправильный порядок

export class VideoFilesReader extends Readable {
    currentSegment = 0;
    currentFileName = "";
    constructor(options?: ReadableOptions) {
        super(options);
    }

    _read(size?: number): void {
        try {
            const fileName = fs.readdirSync("./output")[this.currentSegment++];
            this.currentFileName = fileName!;
            const file = fs.readFileSync(`./output/${fileName}`);
            this.push(file);
        } catch (e) {
            const error = e;
            this.push(null);
        }
    }
}
