import type { ConfigDefault } from "../types.ts";

export default {
    outputDirectory: "./output",
    autoConfirmClearingOutputDirectory: false,
    readingTimeout: 120,
    timeDownloadingSeconds: 0,
    twitchWebhookInternalPort: 4000,
    twitchSubscriptionsEndpoint:
        "https://api.twitch.tv/helix/eventsub/subscriptions",
    twitchOAuthEndpoint: "https://id.twitch.tv/oauth2/token",
    twitchUsersEndpoint: "https://api.twitch.tv/helix/users",
    twitchWebhookMaxMessageIdsTracked: 10,
    secretsYoutubeTokens: "./secret/tokens.json",
    secretsYoutube: "./secret/youtube_secret.json",
    secretsTwitch: "./secret/twitch_secret.json",
    secretsTwitchAppId: "./secret/twitch_app_id.json",
} satisfies ConfigDefault;
