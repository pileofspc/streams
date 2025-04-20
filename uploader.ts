import fs from "fs";
import path from "path";
import readline from "readline/promises";
import assert from "assert";
import { google } from "googleapis";
import { isErrnoException } from "./utils.ts";

import type { Readable } from "stream";
import type { Credentials, OAuth2Client } from "google-auth-library";
import type { ClientSecret } from "./types.ts";

// TODO: Разобраться с путями

const SECRET_DIRECTORY = path.resolve(import.meta.dirname, "./secret");
const SECRET_FILEPATH = path.resolve(SECRET_DIRECTORY, "./secret.json");
const TOKENS_FILEPATH = path.resolve(SECRET_DIRECTORY, "./tokens.json");
const scopes = ["https://www.googleapis.com/auth/youtube.upload"];

class FileSystemError extends Error {}
class AuthError extends Error {}
class UploadError extends Error {}

async function getSecret(): Promise<ClientSecret> {
    try {
        return JSON.parse(
            await fs.promises.readFile(SECRET_FILEPATH, { encoding: "utf-8" })
        );
    } catch (error) {
        throw new FileSystemError(
            `Failed to read/parse secret file: ${SECRET_FILEPATH}. ${
                error instanceof Error ? error.message : String(error)
            }`,
            {
                cause: error,
            }
        );
    }
}

function tokenExists() {
    return fs.existsSync(TOKENS_FILEPATH);
}
async function getExistingToken(): Promise<Credentials> {
    try {
        return JSON.parse(
            await fs.promises.readFile(TOKENS_FILEPATH, { encoding: "utf-8" })
        );
    } catch (error) {
        throw new FileSystemError(
            `Failed to read/parse token file: ${TOKENS_FILEPATH}. \n ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
async function storeToken(token: Credentials) {
    try {
        await fs.promises.mkdir(SECRET_DIRECTORY);
    } catch (error) {
        if (!(isErrnoException(error) && error.code === "EEXIST")) {
            throw new FileSystemError(
                `Failed to create secret directory: ${SECRET_DIRECTORY}. \n ${
                    error instanceof Error ? error.message : String(error)
                }`,
                {
                    cause: error,
                }
            );
        }
    }

    try {
        await fs.promises.writeFile(TOKENS_FILEPATH, JSON.stringify(token));
        console.log("Token stored to: ", TOKENS_FILEPATH);
    } catch (error) {
        throw new FileSystemError(
            `Failed to write to token file: ${TOKENS_FILEPATH}. \n ${
                error instanceof Error ? error.message : String(error)
            }`,
            {
                cause: error,
            }
        );
    }

    return token;
}
async function requestNewToken(
    oAuth2Client: OAuth2Client
): Promise<Credentials> {
    try {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
        });
        console.log("Authorize this app by visiting this url: ", authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const code = await rl.question("Enter the code from that page here: ");
        rl.close();

        const { tokens } = await oAuth2Client.getToken(code);
        return tokens;
    } catch (error) {
        throw new AuthError(
            `Failed to acquire a new token. \n ${
                error instanceof Error ? error.message : String(error)
            }`,
            { cause: error }
        );
    }
}
async function acquireToken(oAuth2Client: OAuth2Client) {
    if (!tokenExists()) {
        console.warn("Token file not found! Requesting new token.");
        return storeToken(await requestNewToken(oAuth2Client));
    }

    return getExistingToken();
}

async function constructAuthorizedClient() {
    try {
        const secret = await getSecret();

        const oAuth2Client = new google.auth.OAuth2(
            secret.installed.client_id,
            secret.installed.client_secret,
            secret.installed.redirect_uris[0]
        );

        oAuth2Client.setCredentials(await acquireToken(oAuth2Client));

        return oAuth2Client;
    } catch (error) {
        throw new AuthError(
            `Authorization client creation failed. \n ${
                error instanceof Error ? error.message : String(error)
            }`,
            { cause: error }
        );
    }
}

export async function uploadVideo(readable: Readable) {
    try {
        console.log("Uploading video...");

        await google.youtube("v3").videos.insert({
            auth: await constructAuthorizedClient(),
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
        throw new UploadError(
            `Video upload failed. ${
                error instanceof Error ? error.message : String(error)
            }`,
            { cause: error }
        );
    }
}
