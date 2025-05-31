import { authorize } from "./auth.ts";
import {
    getSubscriptions,
    revokeSubscription,
} from "./webhook_subscriptions.ts";

const client = await authorize();

const subs = await getSubscriptions(client);

console.log(subs);

await Promise.allSettled(subs.map((sub) => revokeSubscription(client, sub.id)));

const resultingSubs = await getSubscriptions(client);

console.log(resultingSubs.length === 0 && "success");
