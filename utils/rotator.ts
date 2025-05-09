import fs from "fs";
import path from "path";

export class FileRotator {
    private maxFilesToKeep: number;
    private directory: string;
    private lastDeletedIndex?: number;
    constructor(options: { directory: string; maxFilesToKeep?: number }) {
        this.maxFilesToKeep = options.maxFilesToKeep ?? 10;

        if (this.maxFilesToKeep < 0) {
            this.maxFilesToKeep = 0;
            console.warn(
                "Maximum files to keep amount cannot be less than 0! Using 0 instead."
            );
        }
        this.directory = options.directory;
    }
    rotate(allFiles: readonly string[]) {
        const startIndex = this.lastDeletedIndex
            ? this.lastDeletedIndex + 1
            : 0;
        const endIndex = allFiles.length - this.maxFilesToKeep;

        for (let i = startIndex; i < endIndex; i++) {
            const file = path.resolve(this.directory, allFiles[i] ?? "");
            fs.promises.unlink(file).catch((reason) => {
                console.warn(
                    "\n",
                    "Error when deleting file at: ",
                    file,
                    "Error message: ",
                    reason.message ?? reason ?? "Unknown error",
                    "\n"
                );
            });

            this.lastDeletedIndex = i;
        }
    }
}
