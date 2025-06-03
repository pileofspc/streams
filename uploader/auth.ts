import fs from "fs";
// import readline from "readline/promises";
import { google } from "googleapis";
import type { Credentials, OAuth2Client } from "google-auth-library";

import config from "../config/config.ts";
import { getSecret } from "../utils/utils.ts";
import type { YoutubeClientSecret } from "../types.ts";
import { AuthError, FileSystemError } from "../utils/errors.ts";

export const scopeMap = {
    upload: "https://www.googleapis.com/auth/youtube.upload",
} as const;

type ScopeMap = typeof scopeMap;
type ScopeKeys = keyof ScopeMap;
// type ScopeValues = ScopeMap[ScopeKeys];

// function tokenExists() {
//     return fs.existsSync(config.secretsYoutubeTokens);
// }
async function getExistingToken(): Promise<Credentials> {
    try {
        return JSON.parse(
            await fs.promises.readFile(config.secretsYoutubeTokens, {
                encoding: "utf-8",
            })
        );
    } catch (error) {
        throw new FileSystemError(
            `Failed to read/parse token file: ${
                config.secretsYoutubeTokens
            }. \n ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
// async function storeToken(token: Credentials) {
//     try {
//         await fs.promises.writeFile(
//             config.secretsYoutubeTokens,
//             JSON.stringify(token)
//         );
//         console.log("Token stored to: ", config.secretsYoutubeTokens);
//     } catch (error) {
//         throw new FileSystemError(
//             `Failed to write to token file: ${
//                 config.secretsYoutubeTokens
//             }. \n ${error instanceof Error ? error.message : String(error)}`,
//             {
//                 cause: error,
//             }
//         );
//     }

//     return token;
// }

// function generateAuthUrl(oAuth2Client: OAuth2Client, scopes: ScopeValues[]) {
//     return oAuth2Client.generateAuthUrl({
//         access_type: "offline",
//         scope: scopes,
//     });
// }
// async function requestNewToken(
//     oAuth2Client: OAuth2Client,
//     scopes: ScopeValues[]
// ): Promise<Credentials> {
//     try {
//         const authUrl = generateAuthUrl(oAuth2Client, scopes);
//         console.log("Authorize this app by visiting this url: ", authUrl);
//         const rl = readline.createInterface({
//             input: process.stdin,
//             output: process.stdout,
//         });
//         const code = await rl.question("Enter the code from that page here: ");
//         rl.close();

//         const { tokens } = await oAuth2Client.getToken(code);
//         return tokens;
//     } catch (error) {
//         throw new AuthError(
//             `Failed to acquire a new token from youtube. \n ${
//                 error instanceof Error ? error.message : String(error)
//             }`,
//             { cause: error }
//         );
//     }
// }
// async function acquireToken(oAuth2Client: OAuth2Client, scopes: ScopeValues[]) {
//     if (!tokenExists()) {
//         console.warn("Token file not found! Requesting new token.");
//         return storeToken(await requestNewToken(oAuth2Client, scopes));
//     }

//     return getExistingToken();
// }

async function constructOAuthClient(): Promise<OAuth2Client> {
    const secret = await getSecret<YoutubeClientSecret>(config.secretsYoutube);

    const oAuth2Client = new google.auth.OAuth2(
        secret.installed.client_id,
        secret.installed.client_secret,
        secret.installed.redirect_uris[0]
    );

    return oAuth2Client;
}

export async function authorize(scopes: ScopeKeys[]): Promise<OAuth2Client> {
    const oAuth2Client = await constructOAuthClient();

    try {
        oAuth2Client.setCredentials(
            await getExistingToken()
            // await acquireToken(
            //     oAuth2Client,
            //     scopes.map((key) => scopeMap[key])
            // )
        );

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

// export async function handleGenerateAuthUrl() {
//     const client = await constructOAuthClient();
//     const url = generateAuthUrl(client, [scopeMap.upload]);
//     return url;
// }

// FIXME: There might occur an error when token is stored with a certain access scope and we pass another scope from external code to authorize()
// TODO: 'scopes' parameter is passed down through three functions. Refactor to reduce that.
