import { downloadHlsStream } from "./downloader.ts";
import { grabPlaylistUrl } from "./playlist_grabber.ts";
import { VideoFilesReader } from "./reader.ts";
import { uploadVideo } from "./uploader.ts";
import onExit from "node-cleanup";
import { prepareDirectory } from "./preparer.ts";

const STREAM_URL = "https://www.twitch.tv/f1ashko";
const OUTPUT_DIRECTORY = "./output";
const IS_ROBOT = false;
const TIME_DOWNLOADING_SECONDS = 30;
const READING_TIMEOUT = 60;

await prepareDirectory(OUTPUT_DIRECTORY, IS_ROBOT);

const url = await grabPlaylistUrl(STREAM_URL);
const downloader = downloadHlsStream(url, {
    outputDirectory: OUTPUT_DIRECTORY,
    timeSeconds: TIME_DOWNLOADING_SECONDS,
});
onExit((exitCode, signal) => {
    console.log("killing process: ", downloader.pid);
    downloader.kill();
});

uploadVideo(
    new VideoFilesReader({
        directory: OUTPUT_DIRECTORY,
        readingTimeout: READING_TIMEOUT,
    })
);
