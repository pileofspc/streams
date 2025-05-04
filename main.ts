import path from "path";

import configuration from "./config.ts";
import type { Config } from "./types.ts";

import { downloadHlsStreamFromUrl } from "./downloader.ts";
import { grabPlaylistUrl } from "./playlist_grabber.ts";
import { VideoFileReader } from "./reader.ts";
import { uploadVideo } from "./uploader.ts";
import { prepareDirectory } from "./preparer.ts";
import { FileRotator } from "./rotator.ts";

// this is needed because there might be type errors if config is defined using 'satisfies' keyword rather than assigning
// type like this: const config: Config = {// config here}
// i decided to do this for convenience when creating config file
const config: Config = configuration;

// currently i don't know any way of discerning between .ts source files and .ts video files
// so this restriction is in place to prevent accidentally deleting all the source files
if (path.resolve(config.outputDirectory) === path.resolve(process.cwd())) {
    throw new Error("Can't use current working directory as output directory!");
}

await prepareDirectory(
    config.outputDirectory,
    config.autoConfirmClearingOutputDirectory
);

const playlistUrl = await grabPlaylistUrl(config.streamUrl);
downloadHlsStreamFromUrl({
    m3u8Url: playlistUrl,
    outputDirectory: config.outputDirectory,
    timeLimitSeconds: config.timeDownloadingSeconds,
});

// const fileReader = new VideoFileReader({
//     directory: config.outputDirectory,
//     readingTimeout: config.readingTimeout,
// });

// const fileRotator = new FileRotator({
//     directory: "./output",
//     maxFilesToKeep: 10,
// });

// fileReader.subscribe("processed", (files) => {
//     fileRotator.rotate(files);
// });

// await uploadVideo(fileReader);
