import fs from "fs";
import path from "path";
import readline from "readline/promises";

// TODO: Перевести на промисы

export function deleteAllFilesWithExtensionFromDirectory(
    directory: string,
    pattern: string
) {
    const dir = path.resolve(directory);

    const regex = new RegExp(
        `^${pattern
            .replace(/\./g, "\\.")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".")}$`,
        "i"
    );

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    const filesToDelete = entries
        .filter((entry) => entry.isFile() && regex.test(entry.name))
        .map((entry) => entry.name);

    for (const file of filesToDelete) {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
    }
}

export async function confirmAction(message: string) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const answer = await rl.question(message + "\n");
    rl.close();

    return answer.toLowerCase() === "yes" || answer.toLowerCase() === "y";
}

export async function getTotalSize(fullFilepaths: string[]) {
    let sum = 0;
    for (const file of fullFilepaths) {
        const stats = await fs.promises.stat(file);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
        sum += fileSizeInMegabytes;
    }

    return sum.toFixed(2);
}

export async function cleanDirectory(options: {
    directory: string;
    autoConfirm?: boolean;
    pattern?: string;
}) {
    const pattern = options.pattern ?? ".*";

    console.log(
        `Checking if specified directory contains files matching this pattern: ${pattern}`
    );
    const dir = path.resolve(options.directory);
    const files = fs
        .readdirSync(dir)
        .map((file) => path.resolve(options.directory, file));
    if (files.length > 0) {
        console.log(`Specified directory contains some ${pattern} files`);

        if (!options.autoConfirm) {
            const isConfirmed = await confirmAction(
                `Confirm deleting all files (${
                    files.length
                } files with a total size of ${await getTotalSize(
                    files
                )} MB) inside the directory: "${dir}" by typing Y or YES. Otherwise the program will terminate.`
            );

            if (isConfirmed === false) {
                console.log(
                    "Aborting program execution! User hasn't confirmed deleting files."
                );
                process.exit();
            }
        }

        console.log(
            `Deleting all files in specified directory that match this pattern: ${pattern}`
        );
        deleteAllFilesWithExtensionFromDirectory(dir, pattern);
    }
}
