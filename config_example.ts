import type { Config } from "./types.ts";

export default {
    streamUrl: "DESIRED_STREAM_URL",
    outputDirectory: "./output",
    autoConfirmClearingOutputDirectory: false,
    readingTimeout: 120,
    secretDirectory: "./secret",
    secretFilepath: "./secret/secret.json",
    tokensFilepath: "./secret/tokens.json",
    webhookPort: 1001,
} satisfies Config;
