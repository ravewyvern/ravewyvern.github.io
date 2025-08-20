// server.js - Minimal WebSocket bridge for browser <-> Minecraft CC:Tweaked
// Usage: set AUTH_PASSWORD and MC_PASSWORD, then `node server.js`

const WebSocket = require("ws");

const PORT = 8080;

// CHANGE THESE BEFORE USE:
const AUTH_PASSWORD = "penispenispenispenispenis"; // required by browser clients (auth:XXXX)
const MC_PASSWORD = "minecraftpenispenispenis";        // required by the Minecraft computer (register:minecraft:XXXX)

// runtime state
let mcClient = null;     // the websocket for the registered Minecraft computer
const clients = new Set(); // authenticated browser clients

const wss = new WebSocket.Server({ port: PORT }, () => {
    console.log(`WebSocket server listening on port ${PORT}`);
});

wss.on("connection", (ws, req) => {
    console.log("New connection from", req.socket.remoteAddress);
    ws.isAuth = false;
    ws.isMinecraft = false;

    ws.on("message", (data) => {
        const msg = data.toString();

        // Minecraft registration: "register:minecraft:<MC_PASSWORD>"
        if (msg.startsWith("register:minecraft:")) {
            const pass = msg.split(":")[2] || "";
            if (pass === MC_PASSWORD) {
                ws.isMinecraft = true;
                mcClient = ws;
                ws.send("registered:minecraft");
                console.log("Minecraft client registered.");
            } else {
                ws.send("register_failed");
                console.log("Minecraft registration failed (bad password).");
                ws.close();
            }
            return;
        }

        // Browser authentication: "auth:<AUTH_PASSWORD>"
        if (!ws.isAuth && !ws.isMinecraft) {
            if (msg.startsWith("auth:")) {
                const provided = msg.split(":")[1] || "";
                if (provided === AUTH_PASSWORD) {
                    ws.isAuth = true;
                    clients.add(ws);
                    ws.send("authenticated");
                    console.log("Browser client authenticated.");
                } else {
                    ws.send("auth_failed");
                    console.log("Browser auth failed; closing connection.");
                    ws.close();
                }
            } else {
                ws.send("please_auth");
                ws.close();
            }
            return;
        }

        // If this connection is the registered Minecraft client:
        if (ws.isMinecraft) {
            // forward anything Minecraft sends to all authenticated browsers
            const forward = `minecraft: ${msg}`;
            console.log("From MC -> browsers:", msg);
            for (const c of clients) {
                if (c.readyState === WebSocket.OPEN) c.send(forward);
            }
            return;
        }

        // If this is an authenticated browser, treat its messages as commands to MC
        if (ws.isAuth) {
            if (!mcClient || mcClient.readyState !== WebSocket.OPEN) {
                ws.send("error: no minecraft client connected");
                return;
            }
            // forward the raw command string to the minecraft client
            mcClient.send(msg);
            console.log("Forwarded command from browser to MC:", msg);
            return;
        }

        // fallback
        ws.send("unhandled_message");
    });

    ws.on("close", () => {
        console.log("Connection closed");
        if (ws === mcClient) {
            mcClient = null;
            console.log("Minecraft client disconnected.");
        }
        if (clients.has(ws)) clients.delete(ws);
    });

    ws.on("error", (e) => {
        console.log("Socket error:", e && e.message);
    });
});
