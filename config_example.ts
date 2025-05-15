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
    twitchAppIdFilepath: "./secret/twitch_app_id.json",
    webhookURL: `http://localhost:1001/webhook`,
    twitchSubscriptionsEndpoint:
        "https://api.twitch.tv/helix/eventsub/subscriptions",
    twitchOAuthEndpoint: "https://id.twitch.tv/oauth2/token",
    twitchUsersEndpoint: "https://api.twitch.tv/helix/users",
    maxMessages: 10,
} satisfies Config;
