import config from "../config/config.ts";
import type { TwitchAccessToken } from "../types.ts";
import { getSecret, wrapFetchWithHeaderOverrides } from "../utils/utils.ts";

async function getAccessToken(): Promise<string> {
    const params = new URLSearchParams();
    params.append("client_id", await getSecret(config.twitchAppIdFilepath));
    params.append(
        "client_secret",
        await getSecret(config.twitchSecretFilepath)
    );
    params.append("grant_type", "client_credentials");

    const response = await fetch(config.twitchOAuthEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
    });
    const body = (await response.json()) as TwitchAccessToken;

    return body.access_token;
}

export type AuthorizedClient = typeof fetch;
export async function authorize(): Promise<AuthorizedClient> {
    return wrapFetchWithHeaderOverrides({
        Authorization: `Bearer ${await getAccessToken()}`,
        "Client-Id": await getSecret<string>(config.twitchAppIdFilepath),
    });
}
