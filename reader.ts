import fs from "fs";
import path from "path";
import { Readable, type ReadableOptions } from "stream";
import { Publisher, timeout, type Listener } from "./utils.ts";

type NotificationData = readonly string[];

type PublisherEventMap = { processed: [processedFilesInfo: NotificationData] };
export class VideoFileReader extends Readable {
    private _observer = new Publisher<PublisherEventMap>();
    private _processedFiles: string[] = [];
    private _segmentIndex = -1;
    private _fileName = "";
    private _readingTimeout = 60;
    private _readingRetryInterval = 2;
    private _timeWaiting = 0;
    private _directory: string;

    processedFiles: readonly string[] = this._processedFiles;
    get lastProcessedFile() {
        return this._processedFiles[this._processedFiles.length - 1];
    }

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

    _extractSegmentIndex(filename?: string) {
        if (filename == null) return NaN;
        return parseInt(filename.match(/\d+/)?.[0]!);
    }
    _scanDirectory() {
        const files = fs
            .readdirSync(path.resolve(this._directory))
            .filter((value) => value.endsWith(".ts"))
            .sort((a, b) => {
                const a2 = this._extractSegmentIndex(a);
                const b2 = this._extractSegmentIndex(b);

                const aHasNumber = !isNaN(a2);
                const bHasNumber = !isNaN(b2);

                if (!aHasNumber && !bHasNumber) return a.localeCompare(b);
                if (aHasNumber) return 1;
                if (bHasNumber) return -1;
                if (a2 === b2) return a.localeCompare(b);
                return a2 - b2;
            });

        return files;
    }
    _readFile(filename: string) {
        return fs.readFileSync(path.resolve(this._directory, filename));
    }
    _getNextFile(files: string[]) {
        for (let i = files.length - 1; i >= 0; i--) {
            const currentSegmentIndex = this._extractSegmentIndex(files[i]);
            const previousSegmentIndex = this._extractSegmentIndex(
                files[i + 1]
            );

            // works with NaN too
            if (this._segmentIndex < currentSegmentIndex) {
                if (i === 0) {
                    return {
                        name: files[i]!,
                        segmentIndex: currentSegmentIndex,
                    };
                }
                continue;
            }
            if (!isNaN(previousSegmentIndex)) {
                return {
                    name: files[i + 1]!,
                    segmentIndex: previousSegmentIndex,
                };
            }
        }

        return {
            name: this._fileName,
            segmentIndex: this._segmentIndex,
        };
    }
    _updateCurrentFile(file: { name: string; segmentIndex: number }) {
        this._fileName = file.name;
        this._segmentIndex = file.segmentIndex;
    }

    private _updateProcessedFiles() {
        this._processedFiles.push(this._fileName);
        this._observer.emit("processed", this.processedFiles);
    }

    async _read(): Promise<void> {
        const files = this._scanDirectory();
        const nextFile = this._getNextFile(files);

        // the following condition works if the right operand is NaN too
        if (
            nextFile.segmentIndex <
            this._extractSegmentIndex(files[files.length - 1])
        ) {
            this._updateCurrentFile(nextFile);
            console.log("PROCESSING FILE: ", this._fileName);
            this.push(this._readFile(this._fileName));

            this._updateProcessedFiles();

            this._timeWaiting = 0;
        } else {
            if (this._timeWaiting < this._readingTimeout) {
                console.log("waiting...");
                console.log("time is:", this._timeWaiting);
                await timeout(this._readingRetryInterval * 1000);
                this._timeWaiting += this._readingRetryInterval;
                this.push("");
            } else {
                console.log(
                    "Timeout exceeded. Processing the last file and then stopping..."
                );
                this._updateCurrentFile(nextFile);
                console.log("PROCESSING FILE: ", this._fileName);
                this.push(this._readFile(this._fileName));

                this._updateProcessedFiles();

                this.push(null);
            }
        }
    }

    subscribe<E extends keyof PublisherEventMap>(
        event: E,
        listener: Listener<PublisherEventMap[E]>
    ) {
        return this._observer.subscribe(event, listener);
    }
    subscribe2(
        ...args: Parameters<Publisher<PublisherEventMap>["subscribe"]>
    ): ReturnType<Publisher<PublisherEventMap>["subscribe"]> {
        return this._observer.subscribe(...args);
    }
}
