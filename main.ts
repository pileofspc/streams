import path from "path";

import { streamNotifier } from "./notifier/stream_notifier.ts";
import { downloadHlsStreamFromUrl } from "./grabber/downloader.ts";
import { grabPlaylistUrl } from "./grabber/playlist_grabber.ts";
import { VideoFileReader } from "./uploader/reader.ts";
import { uploadVideo } from "./uploader/uploader.ts";
import { cleanDirectory } from "./utils/cleaner.ts";
import { FileRotator } from "./utils/rotator.ts";

import type { Config } from "./types.ts";

import configuration from "./config/config.ts";
// this is needed because there might be type errors if config is defined using 'satisfies' keyword rather than assigning
// type like this: const config: Config = {// config here}
// i decided to do this for convenience when creating config file
const config: Config = configuration;

// currently i don't know any way of discerning between .ts source files and .ts video files
// so this restriction is in place to prevent accidentally deleting all the source files
if (path.resolve(config.outputDirectory) === path.resolve(process.cwd())) {
    throw new Error("Can't use current working directory as output directory!");
}

async function startReuploading() {
    await cleanDirectory({
        directory: config.outputDirectory,
        autoConfirm: config.autoConfirmClearingOutputDirectory,
    });

    const playlistUrl = await grabPlaylistUrl(config.streamUrl);
    downloadHlsStreamFromUrl({
        m3u8Url: playlistUrl,
        outputDirectory: config.outputDirectory,
        timeLimitSeconds: config.timeDownloadingSeconds,
    });

    const fileReader = new VideoFileReader({
        directory: config.outputDirectory,
        readingTimeout: config.readingTimeout,
    });

    const fileRotator = new FileRotator({
        directory: config.outputDirectory,
        maxFilesToKeep: 10,
    });

    fileReader.emitter.subscribe("processed", (files) => {
        fileRotator.rotate(files);
    });

    await uploadVideo(fileReader);
}

function isAllowedToStart() {
    // TODO: implement later
    return true;
}

streamNotifier.emitter.subscribe(() => {
    console.log(
        `Twitch stream at ${
            config.streamUrl
        } started at ${new Date().toUTCString()}`
    );
    if (isAllowedToStart()) {
        console.log("Starting reupload");
        startReuploading();
    }
});
streamNotifier.startListening();
