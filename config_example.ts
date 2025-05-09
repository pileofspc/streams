import type { Config } from "./types.ts";

export default {
    streamUrl: "DESIRED_STREAM_URL",
    outputDirectory: "./output",
    autoConfirmClearingOutputDirectory: false,
    readingTimeout: 120,
    secretDirectory: "./secret",
    tokensFilepath: "./secret/tokens.json",
    youtubeSecretFilepath: "./secret/youtube_secret.json",
    twitchSecretFilepath: "./secret/twitch_secret.json",
    webhookURL: "/webhook",
    webhookPort: 1001,
    twitchSubscriptionEndpoint:
        "https://api.twitch.tv/helix/eventsub/subscriptions",
} satisfies Config;
