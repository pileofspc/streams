import { authorize } from "./auth.ts";
import {
    getSubscriptions,
    revokeSubscription,
} from "./webhook_subscriptions.ts";

const client = await authorize();

const subs = await getSubscriptions(client);

await Promise.allSettled(subs.map((sub) => revokeSubscription(sub.id, client)));

const resultingSubs = await getSubscriptions(client);

console.log(resultingSubs.length === 0 && "success");
