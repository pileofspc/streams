import configuration from "../config.ts";
import type { Config } from "../types.ts";
import { extractURLPathname, getSecret } from "../utils/utils.ts";

const config: Config = configuration;

function getTwitchUserId(streamUrl: string): string {
    const pathname = extractURLPathname(streamUrl);
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] ?? "";
}

export async function subscribe() {
    return fetch(config.twitchSubscriptionEndpoint, {
        method: "POST",
        body: JSON.stringify({
            type: "stream.online",
            version: "1",
            condition: {
                broadcaster_user_id: getTwitchUserId(config.streamUrl),
            },
            transport: {
                method: "webhook",
                callback: config.webhookURL,
                secret: await getSecret<string>(config.twitchSecretFilepath),
            },
        }),
    });
}

console.log();

// export async function revokeSubscription() {
//     await fetch(config.twitchSubscriptionEndpoint, {
//         method: "POST",
//         body: JSON.stringify({
//             type: "stream.online",
//             version: "1",
//             condition: {
//                 broadcaster_user_id: getTwitchUserId(config.streamUrl),
//             },
//             transport: {
//                 method: "webhook",
//                 callback: config.webhookURL,
//                 secret: await getSecret<string>(config.twitchSecretFilepath),
//             },
//         }),
//     });
// }
