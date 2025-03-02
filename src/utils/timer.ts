export const Timer = {
    set(fn: () => void, delay: number): number {
        if (typeof window !== "undefined") {
            return window.setTimeout(fn, delay);
        } else {
            return setTimeout(fn, delay) as unknown as number;
        }
    },

    clear(timeoutId: number) {
        if (typeof window !== "undefined") {
            window.clearTimeout(timeoutId);
        } else {
            clearTimeout(timeoutId);
        }
    },
};
