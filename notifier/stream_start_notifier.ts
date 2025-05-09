import fsp from "fs/promises";
import assert from "assert";
import crypto from "crypto";
import express from "express";

import type {
    Config,
    TwitchExpressRequest,
    TwitchNotification,
} from "../types.ts";

import configuration from "../config.ts";
import { SimplePublisher } from "../utils/utils.ts";
const config: Config = configuration;

const app = express();
export const streamStartNotifier = new SimplePublisher<[TwitchNotification]>();

const PORT = config.webhookPort;
const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id" as const;
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp" as const;
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature" as const;
const MESSAGE_TYPE = "twitch-eventsub-message-type" as const;
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification" as const;
const MESSAGE_TYPE_NOTIFICATION = "notification" as const;
const MESSAGE_TYPE_REVOCATION = "revocation" as const;
const HMAC_PREFIX = "sha256=" as const;
const SECRET = await getSecret();

async function getSecret(): Promise<string> {
    return JSON.parse(
        await fsp.readFile(config.twitchSecretFilepath, { encoding: "utf-8" })
    );
}

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
    config.webhookURL,
    express.raw({
        // Need raw message body for signature verification
        type: "application/json",
    }),
    async (req: TwitchExpressRequest, res) => {
        const signature = req.headers[TWITCH_MESSAGE_SIGNATURE];
        const body = req.body;

        let message = getHmacMessage(req);
        let hmac = HMAC_PREFIX + getHmac(SECRET, message);
        const isVerified = body && signature && verifyMessage(hmac, signature);

        if (!isVerified) {
            console.log("403");
            console.log("signature is this: ", signature);
            console.log("body is this: ", body);
            console.log("hmac is this: ", hmac);
            console.log("message is this: ", message);

            res.sendStatus(403);
            return;
        }

        console.log("signatures match");
        let notification: TwitchNotification = JSON.parse(body);

        switch (req.headers[MESSAGE_TYPE]) {
            case MESSAGE_TYPE_NOTIFICATION:
                console.log(`Event type: ${notification.subscription.type}`);
                console.log(JSON.stringify(notification.event, null, 4));
                res.sendStatus(204);

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
