import { firefox } from "playwright";
import { timeout } from "./utils.ts";

export async function grabPlaylistUrl(
    url: string,
    options?: {
        timeout?: number;
    }
) {
    const config = {
        timeout: 30_000,
        ...options,
    };

    console.log("Grabbing playlist URL...");

    const playlistUrl = new Promise<string>(async (resolve) => {
        const browser = await firefox.launch();
        const page = await browser.newPage();

        // closing browser before fully loading a page might error, so need to catch that here
        await page.goto(url).catch(() => {});

        page.on("response", async (response) => {
            const requestUrl = response.url();
            const method = response.request().method();
            if (method === "GET" && requestUrl.includes(".m3u8")) {
                resolve(requestUrl);
                await browser.close();
            }
        });
    });

    return Promise.race([
        playlistUrl,
        timeout(config.timeout).then(() => Promise.reject()),
    ]);
}
