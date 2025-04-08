import { downloadHlsStreamFromUrl } from "./downloader.ts";
import { grabPlaylistUrl } from "./playlist_grabber.ts";
import { VideoFilesReader } from "./reader.ts";
import { uploadVideo } from "./uploader.ts";
import { prepareDirectory } from "./preparer.ts";

const STREAM_URL = "https://www.twitch.tv/melharucos";
const OUTPUT_DIRECTORY = "./output";
const IS_ROBOT = true;
const TIME_DOWNLOADING_SECONDS = 300;
const READING_TIMEOUT = 120;

// await prepareDirectory(OUTPUT_DIRECTORY, IS_ROBOT);

// const playlistUrl = await grabPlaylistUrl(STREAM_URL, { timeout: 300_000 });
// downloadHlsStreamFromUrl(playlistUrl, {
//     outputDirectory: OUTPUT_DIRECTORY,
//     timeSeconds: TIME_DOWNLOADING_SECONDS,
// });
// uploadVideo(
//     new VideoFilesReader({
//         directory: OUTPUT_DIRECTORY,
//         readingTimeout: READING_TIMEOUT,
//     })
// );

const reader = new VideoFilesReader({
    directory: "./output",
});

reader.subscribe("processed", (processedFiles) => {
    console.log(processedFiles.lastProcessedFile);
    console.log(processedFiles.processedFiles);
});

reader.on("data", (chunk) => {
    // console.log(chunk);
});
