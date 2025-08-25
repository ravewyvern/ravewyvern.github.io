// --- Utilities ---
function hexToBytes(hex) {
    if (!hex) return new Uint8Array();
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Bytes(msg) {
    const enc = new TextEncoder().encode(msg);
    const digest = await crypto.subtle.digest("SHA-256", enc);
    return new Uint8Array(digest);
}
async function importAesKeyFromBytes(keyBytes) {
    return await crypto.subtle.importKey(
        "raw",
        keyBytes.buffer ? keyBytes.buffer : keyBytes,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
    );
}
function base64ToUint8Array(base64) {
    // atob -> Uint8Array
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

// decrypt one encrypted filename using provided raw key bytes (Uint8Array)
async function decryptFilenameWithKeyBytes(encBase64, keyBytes) {
    try {
        const key = await importAesKeyFromBytes(keyBytes);
        const encBytes = base64ToUint8Array(encBase64);
        const iv = encBytes.slice(0, 16);
        const data = encBytes.slice(16);
        const plainBuf = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, key, data);
        const decoded = new TextDecoder().decode(plainBuf);
        // strip PKCS#7 style padding bytes (0x01..0x10)
        return decoded.replace(/[\x00-\x10]+$/g, "");
    } catch (e) {
        // Failed to decrypt or bad padding => invalid key
        return null;
    }
}

// find a decrypted filename that ends with .html
function pickHtmlFilename(decryptedMap) {
    for (const k in decryptedMap) {
        const name = decryptedMap[k];
        if (typeof name === "string" && name.match(/\.html$/i)) return name;
    }
    // fallback return first value
    const vals = Object.values(decryptedMap);
    return vals.length ? vals[0] : null;
}

// --- Main behavior ---
const STATUS = document.getElementById("status");
const PASS_INPUT = document.getElementById("password");
const LOGIN_BTN = document.getElementById("loginBtn");
const STAY = document.getElementById("stay");

function setStatus(msg) {
    if (STATUS) STATUS.textContent = msg;
}

// Attempt to auto-login if a saved key exists in localStorage
async function tryAutoLogin() {
    const storedKeyHex = localStorage.getItem("stay_key_hex");
    if (!storedKeyHex) return;
    setStatus("Checking saved login…");
    try {
        const files = await fetch("files.json").then(r => r.json());
        const keyBytes = hexToBytes(storedKeyHex);
        const decrypted = {};
        for (const encKey in files) {
            const enc = files[encKey];
            const name = await decryptFilenameWithKeyBytes(enc, keyBytes);
            if (!name || !(/\.(html|css|js)$/i.test(name))) {
                setStatus("");
                return; // stored key invalid (maybe user changed password) — do not remove key automatically
            }
            decrypted[encKey] = name;
        }
        // success — redirect to decrypted HTML file (do not store decrypted url)
        const htmlFile = pickHtmlFilename(decrypted);
        if (htmlFile) {
            setStatus("Redirecting…");
            window.location.href = htmlFile;
        }
    } catch (e) {
        console.error(e);
        setStatus("");
    }
}

// Called when user clicks Unlock
async function checkPassword() {
    const password = PASS_INPUT.value || "";
    if (!password) {
        setStatus("Enter a password.");
        return;
    }
    setStatus("Checking...");
    try {
        const keyBytes = await sha256Bytes(password); // matches how your Python derived the AES key
        const files = await fetch("files.json").then(r => r.json());

        const decrypted = {};
        for (const encKey in files) {
            const enc = files[encKey];
            const name = await decryptFilenameWithKeyBytes(enc, keyBytes);
            if (!name || !(/\.(html|css|js)$/i.test(name))) {
                setStatus("Wrong password.");
                return;
            }
            decrypted[encKey] = name;
        }

        // success
        // optionally persist derived key hex if "stay logged in" checked
        if (STAY && STAY.checked) {
            localStorage.setItem("stay_key_hex", bytesToHex(keyBytes));
        }

        const htmlFile = pickHtmlFilename(decrypted);
        if (htmlFile) {
            // Redirect to decrypted HTML page
            setStatus("Access granted — redirecting...");
            // small delay so user sees message
            setTimeout(() => window.location.href = htmlFile, 250);
        } else {
            setStatus("Access granted, but no HTML file found.");
        }
    } catch (e) {
        console.error(e);
        setStatus("Error checking password.");
    }
}

// Enter key handler for password input
PASS_INPUT.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
        ev.preventDefault();
        LOGIN_BTN.click();
    }
});

// Attach button
LOGIN_BTN.addEventListener("click", checkPassword);

// run auto-login on load
tryAutoLogin();
