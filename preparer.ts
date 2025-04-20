import fs from "fs";
import path from "path";
import readline from "readline/promises";

// TODO: Перевести на промисы

export function deleteAllFilesWithExtensionFromDirectory(
    directory: string,
    extension: string
) {
    const dir = path.resolve(directory);

    const files = fs
        .readdirSync(directory)
        .filter((file) => path.extname(file) === extension);
    for (const file of files) {
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

export async function prepareDirectory(
    directory: string,
    autoConfirm?: boolean
) {
    console.log("Checking if specified output directory is empty");
    const dir = path.resolve(directory);
    const files = fs
        .readdirSync(dir)
        .map((file) => path.resolve(directory, file));
    if (files.length > 0) {
        console.log("Specified directory is not empty");

        if (!autoConfirm) {
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

        console.log("Deleting all files in output directory");
        deleteAllFilesWithExtensionFromDirectory(dir, ".ts");
    }
}
