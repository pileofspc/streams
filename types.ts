import type { Express } from "express";

export type Config = {
    streamUrl: string;
    outputDirectory: string;
    autoConfirmClearingOutputDirectory?: boolean;
    timeDownloadingSeconds?: number;
    readingTimeout?: number;
    secretDirectory: string;
    secretFilepath: string;
    tokensFilepath: string;
    webhookPort: number;
};

export type ClientSecret = {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
};

export type TwitchNotification = {
    challenge: string;
    subscription: {
        id: string;
        status: string;
        type: string;
        version: string;
        condition: { broadcaster_user_id: string };
        transport: {
            method: string;
            callback: string;
        };
        created_at: string;
        cost: number;
    };
    event: string;
};

type ExpressRequest = Parameters<Parameters<Express["post"]>[1]>[0];
export type TwitchExpressRequest = Omit<ExpressRequest, "body"> & {
    headers: {
        "twitch-eventsub-message-id"?: string;
        "twitch-eventsub-message-retry"?: string;
        "twitch-eventsub-message-signature"?: string;
        "twitch-eventsub-message-timestamp"?: string;
        "twitch-eventsub-message-type"?: string;
        "twitch-eventsub-subscription-type"?: string;
        "twitch-eventsub-subscription-version"?: string;
        "accept-encoding"?: string;
    };
    // body?: TwitchNotification;
    body?: string;
};

export type SparseArray<T> = (T | undefined)[];
