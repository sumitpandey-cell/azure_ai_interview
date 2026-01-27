/**
 * Polyfill for Promise.withResolvers for PDF.js compatibility
 */
if (typeof window !== 'undefined') {
    if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers === 'undefined') {
        Object.defineProperty(Promise, 'withResolvers', {
            value: function () {
                let resolve, reject;
                const promise = new Promise((res, rej) => {
                    resolve = res;
                    reject = rej;
                });
                return { promise, resolve, reject };
            },
            configurable: true,
            writable: true
        });
    }
}
export { };
