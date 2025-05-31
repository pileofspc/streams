import configuration from "../config/config.ts";
import { getSecret } from "../utils/utils.ts";
import type {
    Config,
    TwitchSubscription,
    TwitchTransport,
    TwitchUser,
} from "../types.ts";
import { authorize, type AuthorizedClient } from "./auth.ts";

const config: Config = configuration;

const broadcaster_user_id = await getTwitchUserId(
    await authorize(),
    config.streamUrl
);

export async function getExistingSubscriptionId(authClient: AuthorizedClient) {
    console.log(`Checking if subscription exists...`);

    const subs = await getSubscriptions(authClient);

    for (const sub of subs) {
        if (
            sub.condition.broadcaster_user_id === broadcaster_user_id &&
            sub.status === "enabled"
        )
            console.log(`Subscription DOES exist`);
        return sub.id;
    }

    console.log(`Subscription DOES NOT exist`);
    return null;
}

export async function getTwitchUserId(
    authClient: AuthorizedClient,
    streamUrl: string
) {
    console.log("Getting Twitch User Id...");

    const pathname = new URL(streamUrl).pathname;
    const parts = pathname.split("/").filter(Boolean);
    const login = parts[0] ?? "";

    const url = new URL(config.twitchUsersEndpoint);
    url.searchParams.append("login", login);

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

    console.log("Getting list of all existing subscriptions...");

    const response = await authClient(config.twitchSubscriptionsEndpoint);
    const body: TwitchSubscriptionsResponse = await response.json();
    return body.data;
}

export async function requestSubscription(
    authClient: AuthorizedClient
): Promise<TwitchSubscription> {
    console.log("Requesting new subscription...");

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
            broadcaster_user_id: broadcaster_user_id,
        },
        transport: {
            method: "webhook",
            callback: config.twitchWebhookExternalUrl,
            secret: await getSecret<string>(config.secretsTwitch),
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

    console.log("response: ", resBody);

    // FIXME: add error handling
    return resBody.data[0]!;
}

export async function revokeSubscription(
    authClient: AuthorizedClient,
    id: string
): Promise<void> {
    console.log("Revoking subscription...");

    const url = new URL(config.twitchSubscriptionsEndpoint);
    url.searchParams.append("id", id);

    const response = await authClient(url, {
        method: "DELETE",
    });

    const body = await response.json();

    console.log("response: ", body);

    // FIXME: add error handling
}
