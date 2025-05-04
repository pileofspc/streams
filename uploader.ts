import fs from "fs";
import readline from "readline/promises";
import { google } from "googleapis";
import type { Readable } from "stream";
import type { Credentials, OAuth2Client } from "google-auth-library";

import configuration from "./config.ts";
import { isErrnoException } from "./utils.ts";
import type { ClientSecret, Config } from "./types.ts";

const config: Config = configuration;

const scopes = ["https://www.googleapis.com/auth/youtube.upload"];

class FileSystemError extends Error {}
class AuthError extends Error {}
class UploadError extends Error {}

async function getSecret(): Promise<ClientSecret> {
    try {
        return JSON.parse(
            await fs.promises.readFile(config.secretFilepath, {
                encoding: "utf-8",
            })
        );
    } catch (error) {
        throw new FileSystemError(
            `Failed to read/parse secret file: ${config.secretFilepath}. ${
                error instanceof Error ? error.message : String(error)
            }`,
            {
                cause: error,
            }
        );
    }
}

function tokenExists() {
    return fs.existsSync(config.tokensFilepath);
}
async function getExistingToken(): Promise<Credentials> {
    try {
        return JSON.parse(
            await fs.promises.readFile(config.tokensFilepath, {
                encoding: "utf-8",
            })
        );
    } catch (error) {
        throw new FileSystemError(
            `Failed to read/parse token file: ${config.tokensFilepath}. \n ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
async function storeToken(token: Credentials) {
    try {
        await fs.promises.mkdir(config.secretDirectory);
    } catch (error) {
        if (!(isErrnoException(error) && error.code === "EEXIST")) {
            throw new FileSystemError(
                `Failed to create secret directory: ${
                    config.secretDirectory
                }. \n ${
                    error instanceof Error ? error.message : String(error)
                }`,
                {
                    cause: error,
                }
            );
        }
    }

    try {
        await fs.promises.writeFile(
            config.tokensFilepath,
            JSON.stringify(token)
        );
        console.log("Token stored to: ", config.tokensFilepath);
    } catch (error) {
        throw new FileSystemError(
            `Failed to write to token file: ${config.tokensFilepath}. \n ${
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
