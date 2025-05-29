import configDefault from "./config_default.ts";
import configUser from "./config_user.ts";
import type { Config } from "../types.ts";

export default {
    ...configDefault,
    ...configUser,
} satisfies Config;
