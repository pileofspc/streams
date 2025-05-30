import express from "express";
import assert from "assert";
import { asyncExitHook } from "exit-hook";

import { getSecret, SimplePublisher } from "../utils/utils.ts";
import { authorize } from "./auth.ts";
import {
    requestSubscription,
    revokeSubscription,
} from "./webhook_subscriptions.ts";
import { getHmac, getHmacMessage, verifyMessage } from "./verification.ts";
import { shouldProcessMessage } from "./deduplication.ts";

import type {
    Config,
    TwitchExpressRequest,
    TwitchNotification,
} from "../types.ts";

import configuration from "../config/config.ts";
const config: Config = configuration;

const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id" as const;
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp" as const;
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature" as const;
const MESSAGE_TYPE = "twitch-eventsub-message-type" as const;
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification" as const;
const MESSAGE_TYPE_NOTIFICATION = "notification" as const;
const MESSAGE_TYPE_REVOCATION = "revocation" as const;

const app = express();
const port = config.twitchWebhookInternalPort || 443;
const webhook_url = new URL(config.twitchWebhookExternalUrl).pathname;
const secret = await getSecret<string>(config.secretsTwitch);
let isListening = false;
let subscriptionId: string;
const emitter = new SimplePublisher<[TwitchNotification]>();

async function startListening() {
    if (isListening) {
        console.log("Already listening!");
        return;
    }
    isListening = true;

    app.post(
        webhook_url,
        express.raw({
            // Need raw message body for signature verification
            type: "application/json",
        }),
        async (req: TwitchExpressRequest, res) => {
            const signature = req.headers[TWITCH_MESSAGE_SIGNATURE];
            const messageId = req.headers[TWITCH_MESSAGE_ID];
            const timestamp = req.headers[TWITCH_MESSAGE_TIMESTAMP];
            const body = req.body;

            assert(messageId && timestamp && body);

            let message = getHmacMessage(messageId, timestamp, body);
            const isVerified =
                !!body &&
                !!signature &&
                !!messageId &&
                verifyMessage(getHmac(secret, message), signature);

            if (!isVerified) {
                res.sendStatus(403);
                return;
            }
            if (!shouldProcessMessage(messageId)) {
                res.sendStatus(200);
                return;
            }

            console.log("signatures match");
            let notification: TwitchNotification = JSON.parse(body);

            switch (req.headers[MESSAGE_TYPE]) {
                case MESSAGE_TYPE_NOTIFICATION:
                    res.sendStatus(204);
                    console.log(
                        `Event type: ${notification.subscription.type}`
                    );
                    console.log(JSON.stringify(notification, null, 4));

                    emitter.emit(notification);

                    break;
                case MESSAGE_TYPE_VERIFICATION:
                    res.set("Content-Type", "text/plain")
                        .status(200)
                        .send(notification.challenge);
                    break;
                case MESSAGE_TYPE_REVOCATION:
                    res.sendStatus(204);
                    console.log(
                        `${notification.subscription.type} notifications revoked!`
                    );
                    console.log(`reason: ${notification.subscription.status}`);
                    console.log(
                        `condition: ${JSON.stringify(
                            notification.subscription.condition,
                            null,
                            4
                        )}`
                    );
                    break;
                default:
                    res.sendStatus(204);
                    console.log(
                        `Unknown message type: ${req.headers[MESSAGE_TYPE]}`
                    );
            }
        }
    );

    app.listen(port);

    subscriptionId = (await requestSubscription(await authorize())).id;
}

asyncExitHook(
    async (signal) => {
        if (subscriptionId) {
            await revokeSubscription(subscriptionId, await authorize());
        }
    },
    { wait: 10_000 }
);

export const streamNotifier = {
    emitter,
    startListening,
    get isListening() {
        return isListening;
    },
};
