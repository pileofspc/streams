import { exec } from "child_process";
import path from "path";

type DownloaderOptions = {
    outputDirectory?: string;
    timeSeconds?: number;
};

export function downloadHlsStream(
    m3u8Url: string,
    options?: DownloaderOptions
) {
    const config = {
        outputDirectory: "./output",
        timeSeconds: 0,
        ...options,
    };

    console.log("Downloading stream...");

    return exec(
        `ffmpeg -i ${m3u8Url} -c copy -f segment -segment_time 6 ${
            config.timeSeconds >= 0
                ? "-t ".concat(config.timeSeconds.toString())
                : ""
        } "${path.resolve(config.outputDirectory, "%05d.ts")}" -y`,
        {
            env: process.env,
            shell: "E:\\Program Files\\Git\\usr\\bin\\bash.exe",
        }
    );
}
