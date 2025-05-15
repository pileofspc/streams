import crypto from "crypto";

export function getHmacMessage(
    message: string,
    timestamp: string,
    body: string
) {
    return message + timestamp + body;
}
export function getHmac(secret: string, message: string) {
    return (
        "sha256=" +
        crypto.createHmac("sha256", secret).update(message).digest("hex")
    );
}
export function verifyMessage(hmac: string, verificationSignature: string) {
    return crypto.timingSafeEqual(
        Buffer.from(hmac),
        Buffer.from(verificationSignature)
    );
}
