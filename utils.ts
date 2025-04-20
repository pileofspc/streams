import mime from "mime-types";

export function isErrnoException(
    error: unknown
): error is Error & NodeJS.ErrnoException {
    return error instanceof Error;
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

export async function sleep(
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
            options.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                rej();
            });
        }
    });
}

export type Listener<T extends any[] = unknown[]> = (...args: T) => void;
export class Publisher<T extends Record<string, any[]>> {
    private readonly _eventMap: Map<keyof T, Listener<any[]>[]> = new Map();
    subscribe<E extends keyof T>(
        event: E,
        listener: Listener<T[E]>
    ): () => void {
        if (!this._eventMap.get(event)) {
            this._eventMap.set(event, []);
        }
        this._eventMap.get(event)?.push(listener);

        return () => this.unsubscribe(event, listener);
    }
    private unsubscribe<E extends keyof T>(
        event: E,
        subscriber: Listener<T[E]>
    ): void {
        const listenerArray = this._eventMap.get(event);
        if (listenerArray) {
            const index = listenerArray.findIndex(
                (value) => value === subscriber
            );
            delete listenerArray[index];
        }
    }
    async emit<E extends keyof T>(event: E, ...data: T[E]): Promise<void> {
        const listenerArray = this._eventMap.get(event);
        if (listenerArray) {
            for (const listener of listenerArray) {
                if (listener) listener(...data);
            }
        }
    }
}
