import * as fs from "fs";
import { nodeInstanceOf } from "./utils.ts";
import { google } from "googleapis";
import * as path from "path";
import readline from "readline/promises";
import assert from "assert";
import type { GoogleCredentials, GoogleToken } from "./types.ts";
import type { Credentials, OAuth2Client } from "google-auth-library";
import { Readable } from "stream";
import { VideoFilesReader } from "./streams.ts";

// TODO: Отсортировать импорты
// TODO: Разобраться с трайкетчами

const SECRET_PATH = path.resolve(import.meta.dirname, "./secret");
const CREDENTIALS_PATH = path.resolve(SECRET_PATH, "./credentials.json");
const TOKEN_PATH = path.resolve(SECRET_PATH, "./token.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const VIDEOFILE_PATH = path.resolve(import.meta.dirname, "./output/all.ts");

const credentials: GoogleCredentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, { encoding: "utf-8" })
);

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
        oAuth2Client.credentials = token;
    } catch (error) {
        if (nodeInstanceOf(error, Error) && error.code === "ENOENT") {
            console.log("Token file not found! Getting new token.");
            await getNewToken(oAuth2Client);
        } else {
            throw error;
        }
    }

    return oAuth2Client;
}

export async function uploadVideoFromDirectory(path: string) {
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
            body: new VideoFilesReader({
                directory: "./output",
            }),
        },
    });
}
