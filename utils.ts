export function nodeInstanceOf<T extends new (...args: any) => Error>(
    value: unknown,
    errorType: T
): value is InstanceType<T> & NodeJS.ErrnoException {
    return value instanceof errorType;
}

export async function timeout(time: number) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            res(true);
        }, time);
    });
}
