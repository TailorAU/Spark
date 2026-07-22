import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const siteDirectory = resolve(scriptDirectory, "..");
const repositoryDirectory = resolve(siteDirectory, "..", "..");
const sourceDirectory = join(repositoryDirectory, "app");
const targetDirectory = join(siteDirectory, "public", "families");

// Keep the unified export's public footprint explicit. CNAME is deliberately
// absent: the root app remains deployable at spark.tailorai.au during cutover,
// while /families/ must not claim that legacy domain.
const publicEntries = [
    "children.enc.json",
    "content.json",
    "family.json",
    "icons",
    "index.html",
    "js",
    "manifest.webmanifest",
    "styles.css",
    "sw.js",
];

let copiedFiles = 0;

async function copyEntry(source, target) {
    const details = await stat(source);

    if (details.isDirectory()) {
        await mkdir(target, { recursive: true });
        const entries = (await readdir(source, { withFileTypes: true }))
            .filter((entry) => entry.name !== ".DS_Store" && !entry.name.startsWith(".env"))
            .sort((left, right) => left.name.localeCompare(right.name));

        for (const entry of entries) {
            if (entry.isSymbolicLink()) {
                throw new Error(`Refusing to publish symbolic link: ${join(source, entry.name)}`);
            }
            await copyEntry(join(source, entry.name), join(target, entry.name));
        }
        return;
    }

    if (!details.isFile()) {
        throw new Error(`Unsupported family asset: ${source}`);
    }

    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    copiedFiles += 1;
}

await rm(targetDirectory, { recursive: true, force: true });
await mkdir(targetDirectory, { recursive: true });

for (const entry of publicEntries) {
    await copyEntry(join(sourceDirectory, entry), join(targetDirectory, entry));
}

console.log(`Refreshed /families/ with ${copiedFiles} files from app/ (CNAME excluded).`);
