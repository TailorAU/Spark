/*
 * Spark — vault & lock (SPARK_AUTH)
 * The child records (real names, DOBs, school) ship ONLY as ciphertext in
 * children.enc.json. This module decrypts them in the browser with a
 * password-derived key (PBKDF2 → AES-256-GCM, WebCrypto). The plaintext never
 * exists in any served file; a wrong password simply fails to decrypt.
 *
 * Because Spark is a static site (no server), this is the only honest way to
 * "password protect" real personal data: publish nothing but ciphertext.
 *
 *   SPARK_AUTH.unlock(password, remember) -> Promise<children[]|null>
 *   SPARK_AUTH.tryRemembered()            -> Promise<children[]|null>
 *   SPARK_AUTH.lock()                     — forget the remembered password
 *   SPARK_AUTH.isUnlocked()               — children currently in memory?
 *   SPARK_AUTH.children()                 — the decrypted records (or [])
 */
(function () {
  "use strict";

  const REMEMBER_KEY = "spark.vault.pw"; // device-local convenience only
  const VAULT_URL = "./children.enc.json";
  const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  let unlocked = null; // decrypted children array once open

  let vaultPromise = null;
  function loadVault() {
    if (!vaultPromise) {
      vaultPromise = fetch(VAULT_URL, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    }
    return vaultPromise;
  }

  async function deriveKey(password, salt, iter) {
    const enc = new TextEncoder();
    const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  }

  async function decryptWith(password) {
    const v = await loadVault();
    if (!v || !v.ct) return null;
    if (!crypto || !crypto.subtle) return null;
    try {
      const key = await deriveKey(password, b64d(v.salt), v.iter || 150000);
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(v.iv) }, key, b64d(v.ct));
      const data = JSON.parse(new TextDecoder().decode(pt));
      return Array.isArray(data) ? data : data.children || null;
    } catch (_) {
      return null; // wrong password (bad GCM tag) or malformed
    }
  }

  async function unlock(password, remember) {
    const kids = await decryptWith(password);
    if (!kids) return null;
    unlocked = kids;
    if (window.SPARK_DATA && window.SPARK_DATA.setChildren) window.SPARK_DATA.setChildren(kids);
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, password);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch (_) {}
    return kids;
  }

  async function tryRemembered() {
    let pw = null;
    try { pw = localStorage.getItem(REMEMBER_KEY); } catch (_) {}
    if (!pw) return null;
    const kids = await unlock(pw, true);
    if (!kids) { try { localStorage.removeItem(REMEMBER_KEY); } catch (_) {} }
    return kids;
  }

  function lock() {
    unlocked = null;
    try { localStorage.removeItem(REMEMBER_KEY); } catch (_) {}
  }

  window.SPARK_AUTH = {
    unlock,
    tryRemembered,
    lock,
    isUnlocked: () => !!unlocked,
    children: () => unlocked || [],
    hasVault: () => loadVault().then((v) => !!(v && v.ct)),
  };
})();
