import type { ConfigDefault } from "../types.ts";

export default {
    outputDirectory: "./output",
    autoConfirmClearingOutputDirectory: false,
    readingTimeout: 120,
    timeDownloadingSeconds: 0,
    youtubeTokensFilepath: "./secret/tokens.json",
    youtubeSecretFilepath: "./secret/youtube_secret.json",
    twitchSecretFilepath: "./secret/twitch_secret.json",
    twitchAppIdFilepath: "./secret/twitch_app_id.json",
    twitchWebhookInternalPort: 4000,
    twitchSubscriptionsEndpoint:
        "https://api.twitch.tv/helix/eventsub/subscriptions",
    twitchOAuthEndpoint: "https://id.twitch.tv/oauth2/token",
    twitchUsersEndpoint: "https://api.twitch.tv/helix/users",
    twitchWebhookMaxMessageIdsTracked: 10,
} satisfies ConfigDefault;
