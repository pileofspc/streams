import type { TwitchExpressRequest, TwitchNotification } from "./types.ts";

import assert from "assert";
import crypto from "crypto";
import express from "express";
const app = express();

const PORT = 1001;
const SECRET =
    "5f1a6e7cd2e7137ccf9e15b2f43fe63949eb84b1db83c1d5a867dc93429de4e4";

const TWITCH_MESSAGE_ID = "twitch-eventsub-message-id" as const;
const TWITCH_MESSAGE_TIMESTAMP = "twitch-eventsub-message-timestamp" as const;
const TWITCH_MESSAGE_SIGNATURE = "twitch-eventsub-message-signature" as const;
const MESSAGE_TYPE = "twitch-eventsub-message-type" as const;
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification" as const;
const MESSAGE_TYPE_NOTIFICATION = "notification" as const;
const MESSAGE_TYPE_REVOCATION = "revocation" as const;
const HMAC_PREFIX = "sha256=" as const;

app.post(
    "/webhook",
    express.raw({
        // Need raw message body for signature verification
        type: "application/json",
    }),
    (req: TwitchExpressRequest, res) => {
        const signature = req.headers[TWITCH_MESSAGE_SIGNATURE];
        const body = req.body;
        let secret = getSecret();
        let message = getHmacMessage(req);
        let hmac = HMAC_PREFIX + getHmac(secret, message);

        if (!signature || !body || verifyMessage(hmac, signature) === false) {
            console.log("403");
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

        if (req.headers[MESSAGE_TYPE] === MESSAGE_TYPE_NOTIFICATION) {
            console.log(`Event type: ${notification.subscription.type}`);
            console.log(JSON.stringify(notification.event, null, 4));
            res.sendStatus(204);
        } else if (req.headers[MESSAGE_TYPE] === MESSAGE_TYPE_VERIFICATION) {
            res.set("Content-Type", "text/plain")
                .status(200)
                .send(notification.challenge);
        } else if (req.headers[MESSAGE_TYPE] === MESSAGE_TYPE_REVOCATION) {
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
        } else {
            res.sendStatus(204);
            console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
        }
    }
);

function getSecret() {
    return SECRET;
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

function verifyMessage(hmac: string, verifySignature: string) {
    return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(verifySignature)
    );
}

app.listen(PORT);
