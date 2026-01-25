declare module '@cashfreepayments/cashfree-js' {
    export interface CashfreeOptions {
        mode: "sandbox" | "production";
    }

    export interface CheckoutOptions {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_modal";
    }

    export interface CashfreeInstance {
        checkout(options: CheckoutOptions): Promise<any>;
    }

    export function load(options: CashfreeOptions): Promise<CashfreeInstance>;
}
