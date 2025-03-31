import { VideoFilesReader } from "./streams.ts";

const reader = new VideoFilesReader({ directory: "./output" });

reader.on("data", (chunk) => {
    console.log("chunk: ");
});
