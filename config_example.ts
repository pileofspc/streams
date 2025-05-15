import type { Config } from "./types.ts";

export default {
    streamUrl: "DESIRED_STREAM_URL",
    outputDirectory: "./output",
    autoConfirmClearingOutputDirectory: false,
    readingTimeout: 120,
    secretDirectory: "./secret",
    youtubeTokensFilepath: "./secret/tokens.json",
    youtubeSecretFilepath: "./secret/youtube_secret.json",
    twitchSecretFilepath: "./secret/twitch_secret.json",
    twitchAppIdFilepath: "./secret/twitch_app_id.json",
    //Twitch requires https and port 443 so you'd need to configure something like nginx
    // to take care of SSL certificates and redirecting api calls to your webhook if it runs on a different port
    webhookExternalURL: `http://localhost:1001/webhook`,
    webhookInternalPort: 4000,
    twitchSubscriptionsEndpoint:
        "https://api.twitch.tv/helix/eventsub/subscriptions",
    twitchOAuthEndpoint: "https://id.twitch.tv/oauth2/token",
    twitchUsersEndpoint: "https://api.twitch.tv/helix/users",
    maxWebhookMessageIdsTracked: 10,
} satisfies Config;
