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

type ArrayRestVoid<T extends any[]> = [...T, ...void[]];
type EventMap = { [key: string]: any[] };
type DefaultPayload = void[];
type DefaultEventMap = {};

export type Listener<T extends any[] = any[]> = (
    ...args: ArrayRestVoid<T>
) => void;
export class Publisher<T extends EventMap = DefaultEventMap> {
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
export class SimplePublisher<T extends any[] = DefaultPayload> {
    private publisher = new Publisher<{ event: [...T] }>();
    subscribe(listener: Listener<T>) {
        return this.publisher.subscribe("event", listener);
    }
    emit(...data: T) {
        return this.publisher.emit("event", ...data);
    }
}
