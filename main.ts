import { firefox } from "playwright";
import { writeFileSync } from "node:fs";

const browser = await firefox.launch();
const page = await browser.newPage();

let counter = 0;

page.on("response", async (response) => {
    const url = response.url();
    const method = response.request().method();
    if (method === "GET" && url.endsWith(".ts")) {
        try {
            const buffer = await response.body();
            const timestamp = Date.now();
            writeFileSync(`./output/segment_${timestamp}.ts`, buffer);

            // writeFileSync(`./output/segment_out.txt`, String(counter++), {
            //     flag: "a",
            // });
        } catch (e) {
            if (e instanceof Error && e.message.includes("preflight")) {
                console.warn("Preflight request error, skipping...");
            } else {
                throw e;
            }
        }
    }
});

await page.goto("https://twitch.tv/hyver");
await page.waitForTimeout(10000); // Playwright's built-in timeout

await browser.close();
