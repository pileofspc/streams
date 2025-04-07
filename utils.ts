import mime from "mime-types";

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

export function createDataUri(filePathOrExt: string, buffer: Buffer) {
    const mimeType = mime.lookup(filePathOrExt) || "application/octet-stream";
    const base64 = buffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
}

export async function timeout(
    time: number,
    options?: {
        shouldReject?: boolean;
        signal?: AbortSignal;
    }
) {
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
