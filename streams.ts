import fs from "fs";
import path from "path";
import { Readable, type ReadableOptions } from "stream";
import { timeout } from "./utils.ts";

// TODO: Может быть на линуксе будет неправильный порядок

export class VideoFilesReader extends Readable {
    // _currentAmountOfFiles = 0;
    _currentSegmentIndex = 0;
    _currentFileName = "";
    _readingTimeout = 60;
    _readingRetryInterval = 2;
    _timeWaiting = 0;
    _directory: string;
    constructor(
        options: ReadableOptions & {
            directory: string;
            readingTimeout?: number;
            readingRetryInterval?: number;
        }
    ) {
        super(options);
        this._directory = options.directory;

        if (typeof options.readingTimeout !== "number") {
            console.warn(
                `Reading timeout must be a number! Using default timeout of ${this._readingTimeout} seconds`
            );
        } else if (
            typeof options.readingTimeout === "number" &&
            options.readingTimeout <= 0
        ) {
            console.warn(
                `Reading timeout must be positive! Using default timeout of ${this._readingTimeout} seconds`
            );
            return;
        } else {
            this._readingTimeout = options.readingTimeout;
        }

        if (typeof options.readingRetryInterval !== "number") {
            console.warn(
                `Retry interval must be a number! Using default interval of ${this._readingRetryInterval} seconds`
            );
        } else if (options.readingRetryInterval < 0) {
            console.warn(
                `Retry interval must be positive! Using default interval of ${this._readingRetryInterval} seconds`
            );
        } else if (options.readingRetryInterval > this._readingTimeout) {
            console.warn(
                `Retry interval must be less than readingTimeout! Using default interval of ${this._readingRetryInterval} seconds`
            );
        } else {
            this._readingRetryInterval = options.readingRetryInterval;
        }
    }
    _scanDirectory() {
        const files = fs.readdirSync(path.resolve(this._directory));
        return files.length;
    }
    _getFile(index: number) {
        const files = this._scanDirectory();
        const fileName = `${index}.ts`;
        this._currentFileName = fileName!;
        const file = fs.readFileSync(path.resolve(this._directory, fileName!));

        return file;
    }
    async _read(): Promise<void> {
        const amountOfFiles = this._scanDirectory();

        if (this._currentSegmentIndex < amountOfFiles - 1) {
            this.push(this._getFile(this._currentSegmentIndex));
            console.log("pushed: ", this._currentFileName);
            this._currentSegmentIndex++;
            console.log("new index: ", this._currentSegmentIndex);
            this._timeWaiting = 0;
            console.log("new time waiting: ", this._timeWaiting);
        } else {
            if (this._timeWaiting < this._readingTimeout) {
                console.log("waiting...");
                console.log("time is:", this._timeWaiting);
                await timeout(this._readingRetryInterval * 1000);
                this._timeWaiting += this._readingRetryInterval;
                this.push("");
            } else {
                console.log("timeout exceeded. stopping");
                this.push(this._getFile(this._currentSegmentIndex));
                this.push(null);
            }
        }
    }
}
