import * as fs from "fs";
import { nodeInstanceOf } from "./utils.ts";
import { google } from "googleapis";
import * as path from "path";
import readline from "readline/promises";
import type { CredentialsJson, Token } from "./types.ts";

type AUTH = InstanceType<typeof google.auth.OAuth2>;

// TODO: Отсортировать импорты
// TODO: Разобраться с трайкетчами

const SECRET_PATH = path.resolve(import.meta.dirname, "./secret");
const CREDENTIALS_PATH = path.resolve(SECRET_PATH, "./credentials.json");
const TOKEN_PATH = path.resolve(SECRET_PATH, "./token.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const VIDEOFILE_PATH = path.resolve(import.meta.dirname, "./output/all.ts");

const credentials: CredentialsJson = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, { encoding: "utf-8" })
);

async function getNewToken(oAuth2Client: AUTH) {
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

    return await new Promise((res, rej) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log("Error while trying to retrieve access token", err);
                rej();
            }
            oAuth2Client.credentials = token!;
            storeToken(token!);
            res(token);
        });
    });
}
function storeToken(token: Token) {
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
    credentials: CredentialsJson
): Promise<AUTH> {
    const oAuth2Client = new google.auth.OAuth2(
        credentials.installed.client_id,
        credentials.installed.client_secret,
        credentials.installed.redirect_uris[0]
    );

    let token: any = null;
    try {
        token = JSON.parse(fs.readFileSync(TOKEN_PATH, { encoding: "utf-8" }));
    } catch (error) {
        if (nodeInstanceOf(error, Error) && error.code === "ENOENT") {
            console.log("Token file not found! Getting new token.");
            await getNewToken(oAuth2Client);
        } else {
            throw error;
        }
    }

    oAuth2Client.credentials = token;

    return oAuth2Client;
}

async function uploadVideo() {
    const service = google.youtube("v3");
    google.youtube("v3").videos.insert({
        auth: await getAuthorizedClient(credentials),
        part: "snippet,status",
        requestBody: {
            snippet: {
                title: Date.now(),
                description: "Ну да я",
                tags: [],
                defaultLanguage: "ru",
                defaultAudioLanguage: "ru",
            },
            status: {
                privacyStatus: "private",
            },
        },
        media: {
            body: fs.createReadStream(VIDEOFILE_PATH),
        },
    });
}

uploadVideo();
