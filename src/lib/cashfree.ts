import { Cashfree, CFEnvironment } from "cashfree-pg";

const XEnvironment = process.env.CASHFREE_ENV === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;

export const cashfree = new Cashfree(
    XEnvironment,
    process.env.CASHFREE_APP_ID!,
    process.env.CASHFREE_SECRET_KEY!,
);
