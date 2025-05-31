import configuration from "../config/config.ts";
import { getSecret } from "../utils/utils.ts";
import type {
    Config,
    TwitchSubscription,
    TwitchTransport,
    TwitchUser,
} from "../types.ts";
import type { AuthorizedClient } from "./auth.ts";

const config: Config = configuration;

export async function getTwitchUserId(
    streamUrl: string,
    authClient: AuthorizedClient
) {
    const pathname = new URL(streamUrl).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const login = parts[0] ?? "";

    const url = new URL(config.twitchUsersEndpoint);
    url.searchParams.append("login", login);

    console.log("Getting Twitch User Id...");

    const response = await authClient(url);
    const body = (await response.json()) as {
        data: TwitchUser[];
    };

    console.log("response:", body);

    // FIXME: add error handling
    return body.data[0]?.id!;
}

export async function getSubscriptions(authClient: AuthorizedClient) {
    type TwitchSubscriptionsResponse = {
        total: number;
        data: TwitchSubscription[];
    };

    const response = await authClient(config.twitchSubscriptionsEndpoint);
    const body: TwitchSubscriptionsResponse = await response.json();
    return body.data;
}

export async function requestSubscription(
    authClient: AuthorizedClient
): Promise<TwitchSubscription> {
    type SubscriptionRequest = {
        type: string;
        version: string;
        condition: Record<string, unknown>;
        transport: TwitchTransport;
    };
    const reqBody: SubscriptionRequest = {
        type: "stream.online",
        version: "1",
        condition: {
            broadcaster_user_id: await getTwitchUserId(
                config.streamUrl,
                authClient
            ),
        },
        transport: {
            method: "webhook",
            callback: config.twitchWebhookExternalUrl,
            secret: await getSecret<string>(config.secretsTwitch),
        },
    };

    console.log("Requesting subscription...");

    const response = await authClient(config.twitchSubscriptionsEndpoint, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: {
            "Content-Type": "application/json",
        },
    });
    type SubscriptionResponse = {
        data: TwitchSubscription[];
        total: number;
        total_cost: number;
        max_total_cost: number;
    };
    const resBody: SubscriptionResponse = await response.json();

    console.log("response: ", resBody);

    // FIXME: add error handling
    return resBody.data[0]!;
}

export async function revokeSubscription(
    id: string,
    authClient: AuthorizedClient
): Promise<void> {
    const url = new URL(config.twitchSubscriptionsEndpoint);
    url.searchParams.append("id", id);

    console.log("Revoking subscription...");

    const response = await authClient(url, {
        method: "DELETE",
    });

    const body = await response.json();

    console.log("response: ", body);

    // FIXME: add error handling
}
