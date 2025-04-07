import { exec } from "child_process";
import path from "path";
import onExit from "node-cleanup";

export function downloadHlsStreamFromUrl(
    m3u8Url: string,
    options?: {
        outputDirectory?: string;
        timeSeconds?: number;
    }
) {
    const config = {
        outputDirectory: "./output",
        timeSeconds: 0,
        ...options,
    };

    console.log("Downloading stream...");

    const cmd = `ffmpeg -i "${m3u8Url}" -user_agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36" -c copy -f segment -segment_time 6 ${
        config.timeSeconds > 0
            ? "-t ".concat(config.timeSeconds.toString())
            : ""
    } "${path.resolve(config.outputDirectory, "%05d.ts")}" -y`;

    const downloader = exec(cmd, {
        env: process.env,
        shell: "bash",
    });

    onExit((exitCode, signal) => {
        console.log("killing process: ", downloader.pid);
        downloader.kill();
    });

    return downloader;
}
