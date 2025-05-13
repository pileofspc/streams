import { google } from "googleapis";
import type { Readable } from "stream";

import configuration from "../config.ts";
import type { Config } from "../types.ts";
import { NetworkError } from "../utils/errors.ts";
import { authorize } from "./auth.ts";

const config: Config = configuration;

export async function uploadVideo(readable: Readable) {
    try {
        console.log("Uploading video...");

        await google.youtube("v3").videos.insert({
            auth: await authorize(["upload"]),
            part: ["snippet", "status"],
            requestBody: {
                snippet: {
                    title: String(Date.now()),
                    description: "Ну да я",
                    defaultLanguage: "ru",
                    defaultAudioLanguage: "ru",
                },
                status: {
                    privacyStatus: "private",
                },
            },
            media: {
                body: readable,
            },
        });
    } catch (error) {
        throw new NetworkError(
            `Video upload failed. ${
                error instanceof Error ? error.message : String(error)
            }`,
            { cause: error }
        );
    }
}
