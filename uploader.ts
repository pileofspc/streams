import fs from "fs";
import path from "path";
import readline from "readline/promises";
import assert from "assert";
import { google } from "googleapis";
import { nodeInstanceOf, secondsToMs } from "./utils.ts";

import type { GoogleCredentials, GoogleToken } from "./types.ts";
import type { Readable } from "stream";
import type { Credentials, OAuth2Client } from "google-auth-library";

// TODO: Отсортировать импорты
// TODO: Разобраться с трайкетчами

const SECRET_PATH = path.resolve(import.meta.dirname, "./secret");
const CREDENTIALS_PATH = path.resolve(SECRET_PATH, "./credentials.json");
const TOKEN_PATH = path.resolve(SECRET_PATH, "./token.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

const credentials: GoogleCredentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, { encoding: "utf-8" })
);

function isTokenExpired(token: GoogleToken) {
    const padding = secondsToMs(30);
    return (
        token.expiry_date == null || token.expiry_date < Date.now() - padding
    );
}

async function getNewToken(oAuth2Client: OAuth2Client): Promise<Credentials> {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    console.log("Authorize this app by visiting this url: ", authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const code = await rl.question("Enter the code from that page here: ");
    rl.close();

    return new Promise((res, rej) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log("Error while trying to retrieve access token", err);
                rej();
            }

            assert(token != null);
            oAuth2Client.credentials = token;
            storeToken(token);
            res(token);
        });
    });
}
function storeToken(token: GoogleToken) {
    try {
        fs.mkdirSync(SECRET_PATH);
    } catch (error) {
        if (!(nodeInstanceOf(error, Error) && error.code === "EEXIST")) {
            throw error;
        }
    }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to: ", TOKEN_PATH);
}
async function getAuthorizedClient(
    credentials: GoogleCredentials
): Promise<OAuth2Client> {
    const oAuth2Client = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
    );

    try {
        const token: GoogleToken = JSON.parse(
            fs.readFileSync(TOKEN_PATH, { encoding: "utf-8" })
        );
        if (isTokenExpired(token)) {
            throw new Error("Token expired");
        }
        oAuth2Client.credentials = token;
    } catch (error) {
        if (nodeInstanceOf(error, Error) && error.code === "ENOENT") {
            console.warn("Token file not found! Getting new token.");
            await getNewToken(oAuth2Client);
        } else if ((error as Error).message === "Token expired") {
            console.warn("Token expired! Getting new token.");
            await getNewToken(oAuth2Client);
        } else {
            throw error;
        }
    }

    return oAuth2Client;
}

export async function uploadVideo(readable: Readable) {
    console.log("Uploading video...");

    google.youtube("v3").videos.insert({
        auth: await getAuthorizedClient(credentials),
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
}
