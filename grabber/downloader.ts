import { exec } from "child_process";
import path from "path";
import exitHook from "exit-hook";

async function isFfmpegInstalled() {
    return new Promise((res) => {
        exec("ffmpeg -version", (stderr, stdout) => {
            res(!stderr);
        });
    });
}

async function assertFfmpegInstallation() {
    console.log("Checking if Ffmpeg is installed...");
    if (!(await isFfmpegInstalled())) {
        console.log("Checking if Ffmpeg is installed...");
        throw new Error("ffmpeg is required to run this application");
    }
    console.log("ffmpeg is installed. Continuing...");

    console.log("Downloading stream...");
}

export async function downloadHlsStreamFromUrl(config: {
    m3u8Url: string;
    outputDirectory: string;
    timeLimitSeconds?: number;
}) {
    await assertFfmpegInstallation();

    const timeLimit = config.timeLimitSeconds;
    const shouldLimitTime = typeof timeLimit === "number" && timeLimit > 0;

    const cmd = `ffmpeg -i "${
        config.m3u8Url
    }" -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" -c copy -f segment -segment_time 6 ${
        shouldLimitTime ? "-t ".concat(timeLimit.toString()) : ""
    } "${path.resolve(config.outputDirectory, "%05d.ts")}" -y`;

    const downloader = exec(cmd);

    exitHook((signal) => {
        console.log("killing process: ", downloader.pid);
        downloader.kill();
    });

    return downloader;
}
