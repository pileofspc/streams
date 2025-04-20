import fs from "fs";
import path from "path";

export class FileRotator {
    private maxFilesToKeep: number = 10;
    private directory: string;
    private lastDeletedIndex?: number;
    constructor(options: { maxFilesToKeep?: number; directory: string }) {
        const padding = options?.maxFilesToKeep ?? 0;
        if (padding < 0) {
            this.maxFilesToKeep = 0;
            console.warn(
                "Padding can't be less than zero! Using minimal padding of 0"
            );
        }
        this.directory = options.directory;
    }
    rotate(files: readonly string[]) {
        const startIndex = this.lastDeletedIndex
            ? this.lastDeletedIndex + 1
            : 0;
        const endIndex = files.length - this.maxFilesToKeep;
        for (let i = startIndex; i < endIndex; i++) {
            const item = files[i];
            const file = path.resolve(this.directory, item ?? "");
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
