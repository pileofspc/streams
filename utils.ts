import path from "path";
import fs from "fs";
import readline from "readline/promises";

export function nodeInstanceOf<T extends new (...args: any) => Error>(
    value: unknown,
    errorType: T
): value is InstanceType<T> & NodeJS.ErrnoException {
    return value instanceof errorType;
}

export function hoursToMs(hours: number) {
    return 1000 * 60 * 60 * hours;
}
export function secondsToMs(seconds: number) {
    return 1000 * seconds;
}

type TimeoutOptions = {
    shouldReject?: boolean;
    signal?: AbortSignal;
};
export async function timeout(time: number, options?: TimeoutOptions) {
    const shouldReject = options?.shouldReject || false;

    return new Promise<void>((res, rej) => {
        const timeoutId = setTimeout(() => {
            shouldReject ? rej() : res();
        }, time);

        if (options?.signal instanceof AbortSignal) {
            options?.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                rej();
            });
        }
    });
}
