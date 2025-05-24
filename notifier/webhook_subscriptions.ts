import configuration from "../config.ts";
import { getSecret } from "../utils/utils.ts";
import type {
    Config,
    TwitchSubscription,
    TwitchTransport,
    TwitchUser,
} from "../types.ts";
import type { AuthorizedClient } from "./auth.ts";

const config: Config = configuration;

async function getTwitchUserId(
    streamUrl: string,
    authClient: AuthorizedClient
) {
    const pathname = new URL(streamUrl).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const login = parts[0] ?? "";

    const url = new URL(config.twitchUsersEndpoint);
    url.searchParams.append("login", login);

    const response = await authClient(url);
    const body = (await response.json()) as {
        data: TwitchUser[];
    };

    // FIXME: add error handling
    return body.data[0]?.id!;
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
            callback: config.webhookExternalURL,
            secret: await getSecret<string>(config.twitchSecretFilepath),
        },
    };

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

    // FIXME: add error handling
    return resBody.data[0]!;
}

export async function revokeSubscription(
    id: string,
    authClient: AuthorizedClient
): Promise<void> {
    const url = new URL(config.twitchSubscriptionsEndpoint);
    url.searchParams.append("id", id);

    await authClient(url, {
        method: "DELETE",
    });

    // FIXME: add error handling
}
