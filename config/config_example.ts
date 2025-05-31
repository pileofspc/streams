import type { ConfigUser } from "../types.ts";

export default {
    streamUrl: "https://twitch.tv/twitch",
    twitchWebhookExternalUrl: "https://example.com/stream",
    twitchWebhookInternalPort: 4000,
    // for Docker Secrets:
    secretsYoutubeTokens: "/run/secrets/tokens",
    secretsYoutube: "/run/secrets/youtube_secret",
    secretsTwitch: "/run/secrets/twitch_secret",
    secretsTwitchAppId: "/run/secrets/twitch_app_id",
    // or without
    // secretsYoutubeTokens: "./secret/tokens.json",
    // secretsYoutube: "./secret/youtube_secret.json",
    // secretsTwitch: "./secret/twitch_secret.json",
    // secretsTwitchAppId: "./secret/twitch_app_id.json",
} satisfies ConfigUser;
