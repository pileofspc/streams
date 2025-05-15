import type { Config } from "../types.ts";

import configuration from "../config.ts";
const config: Config = configuration;

const processedMessageIds: string[] = [];
const MAX_PROCESSED_IDS = config.maxMessages || 10;

export function shouldProcessMessage(messageId: string): boolean {
    if (processedMessageIds.includes(messageId)) {
        return false;
    }

    if (processedMessageIds.length >= MAX_PROCESSED_IDS) {
        processedMessageIds.shift();
    }
    processedMessageIds.push(messageId);

    return true;
}
