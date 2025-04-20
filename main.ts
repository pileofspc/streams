import { downloadHlsStreamFromUrl } from "./downloader.ts";
import { grabPlaylistUrl } from "./playlist_grabber.ts";
import { VideoFileReader } from "./reader.ts";
import { uploadVideo } from "./uploader.ts";
import { prepareDirectory } from "./preparer.ts";
import { FileRotator } from "./rotator.ts";

const STREAM_URL = "https://www.twitch.tv/igorghk";
const OUTPUT_DIRECTORY = "./output";
const AUTO_CONFIRM = true;
const TIME_DOWNLOADING_SECONDS = 60;
const READING_TIMEOUT = 120;

await prepareDirectory(OUTPUT_DIRECTORY, AUTO_CONFIRM);

const playlistUrl = await grabPlaylistUrl(STREAM_URL);
downloadHlsStreamFromUrl(playlistUrl, {
    outputDirectory: OUTPUT_DIRECTORY,
    timeSeconds: TIME_DOWNLOADING_SECONDS,
});

const fileReader = new VideoFileReader({
    directory: OUTPUT_DIRECTORY,
    readingTimeout: READING_TIMEOUT,
});

const fileRotator = new FileRotator({
    directory: "./output",
    maxFilesToKeep: 10,
});

fileReader.subscribe("processed", (files) => {
    fileRotator.rotate(files);
});

await uploadVideo(fileReader);
