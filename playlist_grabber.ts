import { firefox } from "playwright";
import { timeout } from "./utils.ts";

type PlaylistGrabberOptions = {
    timeout?: number;
};

export async function grabPlaylistUrl(
    url: string,
    options?: PlaylistGrabberOptions
) {
    const config = {
        timeout: 30_000,
        ...options,
    };

    console.log("Grabbing playlist URL...");

    const playlistUrl = new Promise<string>(async (resolve) => {
        const browser = await firefox.launch();
        const page = await browser.newPage();

        page.on("response", async (response) => {
            const requestUrl = response.url();
            const method = response.request().method();
            if (method === "GET" && requestUrl.endsWith(".m3u8")) {
                resolve(requestUrl);
                await browser.close();
            }
        });

        // closing browser before fully loading a page might error, so need to catch that here
        page.goto(url).catch(() => {});
    });

    return Promise.race<string>([
        playlistUrl,
        timeout(config.timeout).then(() => Promise.reject()),
    ]);
}
