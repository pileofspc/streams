import { firefox } from "playwright";
import { sleep } from "./utils/utils.ts";

export async function grabPlaylistUrl(url: string, { timeout = 30_000 } = {}) {
    console.log("Grabbing playlist URL...");

    const playlistUrl = new Promise<string>(async (resolve) => {
        const browser = await firefox.launch();
        const page = await browser.newPage();

        page.on("response", async (response) => {
            const requestUrl = response.url();
            const method = response.request().method();
            if (
                method === "GET" &&
                requestUrl.includes(".m3u8") &&
                !requestUrl.endsWith("m3u8")
            ) {
                resolve(requestUrl);
                await browser.close();
            }
        });

        // closing browser before fully loading a page might error, so need to catch that here
        await page.goto(url).catch(() => {});
    });

    return Promise.race([
        playlistUrl,
        sleep(timeout).then(() => Promise.reject()),
    ]);
}
