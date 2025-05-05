import fs from "fs";
import path from "path";
import { Readable, type ReadableOptions } from "stream";
import { Publisher, sleep, type Listener } from "./utils/utils.ts";

type NotificationData = readonly string[];

type PublisherEventMap = { processed: [processedFilesInfo: NotificationData] };
export class VideoFileReader extends Readable {
    observer = new Publisher<PublisherEventMap>();
    private _processedFiles: string[] = [];
    private _segmentIndex = -1;
    private _fileName = "";
    private _readingTimeout;
    private _readingRetryInterval;
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

        this._readingTimeout = this.ensureValidReadingTimeout(
            options.readingTimeout
        );
        this._readingRetryInterval = this.ensureValidRetryInterval(
            options.readingRetryInterval,
            this._readingTimeout
        );
    }

    private ensureValidReadingTimeout(timeout?: number): number {
        const defaultValue = 60;
        const minValue = 5;
        const value = timeout ?? defaultValue;

        if (value <= minValue) {
            console.warn(
                `Reading timeout must be at least ${minValue} seconds. Using minimum value: ${minValue}s.`
            );
            return minValue;
        }

        return value;
    }

    private ensureValidRetryInterval(
        interval: number | undefined,
        timeout: number
    ): number {
        const defaultInterval = 2;
        const minInterval = 1;
        const minDifference = 2;

        if (interval == null) {
            console.warn(
                `Retry interval not provided. Using default: ${defaultInterval}s.`
            );
            interval = defaultInterval;
        }
        if (interval < minInterval) {
            console.warn(
                `Retry interval too low (min ${minInterval}s). Using: ${minInterval}s.`
            );
            interval = minInterval;
        }
        if (timeout - interval <= minDifference) {
            const maxInterval = timeout - minDifference;

            console.warn(
                `Current interval is too large. Difference between timeout and interval must be at least ${minDifference} seconds.
                With timeout of ${timeout}s and interval of ${interval} the difference is ${
                    timeout - interval
                }. Using a maximum interval of ${interval}`
            );

            interval = maxInterval;
        }

        return interval;
    }

    private _extractSegmentIndex(filename?: string) {
        if (filename == null) return NaN;
        return parseInt(filename.match(/\d+/)?.[0]!);
    }
    private _scanDirectory() {
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
    private _readFile(filename: string) {
        return fs.readFileSync(path.resolve(this._directory, filename));
    }
    private _getNextFile(files: string[]) {
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
    private _updateCurrentFile(file: { name: string; segmentIndex: number }) {
        this._fileName = file.name;
        this._segmentIndex = file.segmentIndex;
    }

    private _updateProcessedFiles() {
        this._processedFiles.push(this._fileName);
        this.observer.emit("processed", this.processedFiles);
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
                await sleep(this._readingRetryInterval * 1000);
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

    // subscribe<E extends keyof PublisherEventMap>(
    //     event: E,
    //     listener: Listener<PublisherEventMap[E]>
    // ) {
    //     return this._observer.subscribe(event, listener);
    // }
}
