import assert from "assert";
import crypto from "crypto";
import express from "express";

import configuration from "../config.ts";
import { getSecret, SimplePublisher } from "../utils/utils.ts";

import type {
    Config,
    TwitchExpressRequest,
    TwitchNotification,
} from "../types.ts";

const config: Config = configuration;

const app = express();
export const streamStartNotifier = new SimplePublisher<[TwitchNotification]>();

const PORT = new URL(config.webhookURL).port || 443;
const WEBHOOK_URL = new URL(config.webhookURL).pathname;
const SECRET = await getSecret<string>(config.twitchSecretFilepath);

const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id" as const;
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp" as const;
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature" as const;
const MESSAGE_TYPE = "twitch-eventsub-message-type" as const;
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification" as const;
const MESSAGE_TYPE_NOTIFICATION = "notification" as const;
const MESSAGE_TYPE_REVOCATION = "revocation" as const;
const HMAC_PREFIX = "sha256=" as const;

function getHmacMessage(request: TwitchExpressRequest) {
    const messageId = request.headers[TWITCH_MESSAGE_ID];
    const timestamp = request.headers[TWITCH_MESSAGE_TIMESTAMP];
    const body = request.body;

    assert(messageId && timestamp && body);

    return messageId + timestamp + body;
}

function getHmac(secret: string, message: string) {
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

function verifyMessage(hmac: string, verificationSignature: string) {
    return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(verificationSignature)
    );
}

app.post(
    WEBHOOK_URL,
    express.raw({
        // Need raw message body for signature verification
        type: "application/json",
    }),
    async (req: TwitchExpressRequest, res) => {
        const signature = req.headers[TWITCH_MESSAGE_SIGNATURE];
        const body = req.body;

        let message = getHmacMessage(req);
        let hmac = HMAC_PREFIX + getHmac(SECRET, message);
        const isVerified =
            !!body && !!signature && verifyMessage(hmac, signature);

        if (!isVerified) {
            res.sendStatus(403);
            return;
        }

        console.log("signatures match");
        let notification: TwitchNotification = JSON.parse(body);

        switch (req.headers[MESSAGE_TYPE]) {
            case MESSAGE_TYPE_NOTIFICATION:
                res.sendStatus(204);
                console.log(`Event type: ${notification.subscription.type}`);
                console.log(JSON.stringify(notification.event, null, 4));

                streamStartNotifier.emit(notification);

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

app.listen(PORT);
