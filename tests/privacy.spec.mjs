/*
 * Privacy regression: the repo is PUBLIC. No real child data (names, DOB,
 * school) may appear in any tracked file. This spec decrypts the vault AT
 * RUNTIME with SPARK_VAULT_PW and scans every git-tracked file for the
 * decrypted strings - so the sensitive values never appear in test source,
 * and any future commit that leaks one fails the suite.
 */
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
import { join } from "node:path";
import { requirePassword, PASSWORD } from "./helpers.mjs";

const REPO = fileURLToPath(new URL("..", import.meta.url));

async function decryptVault() {
  const vault = JSON.parse(readFileSync(join(REPO, "app", "children.enc.json"), "utf8"));
  const b64 = (s) => Uint8Array.from(Buffer.from(s, "base64"));
  const enc = new TextEncoder();
  const base = await webcrypto.subtle.importKey("raw", enc.encode(PASSWORD), "PBKDF2", false, [
    "deriveKey",
  ]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(vault.salt), iterations: vault.iter || 150000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const pt = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv: b64(vault.iv) }, key, b64(vault.ct));
  const data = JSON.parse(new TextDecoder().decode(pt));
  return Array.isArray(data) ? data : data.children;
}

test("no decrypted child data appears in any tracked file", async () => {
  requirePassword();
  const kids = await decryptVault();
  expect(kids.length).toBe(3);

  // Sensitive needles: every word of each name, plus school and DOB strings.
  // Generic institution words are not PII (they legitimately appear in docs);
  // a real school NAME would not be on this list and stays caught.
  const GENERIC = new Set([
    "preschool", "kindergarten", "kindy", "school", "daycare", "day care",
    "primary school", "state school", "home", "homeschool",
  ]);
  const needles = new Set();
  for (const k of kids) {
    for (const tok of String(k.name || "").split(/\s+/)) {
      if (tok.length >= 3) needles.add(tok.toLowerCase());
    }
    const school = String(k.school || "").toLowerCase();
    if (school.length >= 4 && !GENERIC.has(school)) needles.add(school);
    if (k.dob) needles.add(String(k.dob).toLowerCase());
  }
  expect(needles.size).toBeGreaterThan(0);

  const tracked = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  expect(tracked.length).toBeGreaterThan(10);

  const leaks = [];
  for (const rel of tracked) {
    let text;
    try {
      text = readFileSync(join(REPO, rel), "utf8").toLowerCase();
    } catch {
      continue; // unreadable/binary - nothing textual to leak
    }
    for (const needle of needles) {
      if (text.includes(needle)) {
        // Report the file and needle length only - never echo the value.
        leaks.push(`${rel} contains a ${needle.length}-char sensitive string`);
      }
    }
  }
  expect(leaks, leaks.join("; ")).toEqual([]);
});

test("password is not remembered anywhere in tracked files", async () => {
  requirePassword();
  const tracked = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const pw = PASSWORD.toLowerCase();
  const leaks = [];
  for (const rel of tracked) {
    let text;
    try {
      text = readFileSync(join(REPO, rel), "utf8").toLowerCase();
    } catch {
      continue;
    }
    if (text.includes(pw)) leaks.push(rel);
  }
  expect(leaks, `files containing the family password: ${leaks.join(", ")}`).toEqual([]);
});
