import { exec } from "child_process";
import path from "path";
import onExit from "node-cleanup";

export function downloadHlsStreamFromUrl(config: {
    m3u8Url: string;
    outputDirectory: string;
    timeLimitSeconds?: number;
}) {
    console.log("Downloading stream...");

    const timeLimit = config.timeLimitSeconds;
    const shouldLimitTime = typeof timeLimit === "number" && timeLimit > 0;

    const cmd = `ffmpeg -i "${
        config.m3u8Url
    }" -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" -c copy -f segment -segment_time 6 ${
        shouldLimitTime ? "-t ".concat(timeLimit.toString()) : ""
    } "${path.resolve(config.outputDirectory, "%05d.ts")}" -y`;

    const downloader = exec(cmd);

    onExit((exitCode, signal) => {
        console.log("killing process: ", downloader.pid);
        downloader.kill();
    });

    return downloader;
}
