import configDefault from "./config_default.ts";
import configUser from "./config_user.ts";
import type { Config } from "../types.ts";

const config: Config = {
    ...configDefault,
    ...configUser,
};
export default config;
