# 🌐 Minecraft Web Command Control — Setup Guide

This guide will let you send Minecraft server commands from a web page, secured with a password.

---

## 🟢 Part 1: Minecraft Setup

1. **Install Minecraft with Forge** and the **CC\:Tweaked mod**.

    * CC\:Tweaked adds programmable computers (including the **Command Computer**) to the game.
2. **Open a world (singleplayer or server).**

3. **Get a Command Computer**
   Run:

   ```
   /give @s computercraft:computer_command
   ```

4. **Create the control script**

    * Right-click the computer.
    * Type:

      ```
      edit redstone_control
      ```
    * Paste in the contents of `redstone_control.lua`.
    * Press **Ctrl+S** to save, then **Ctrl+Exit** to close the editor.

---

## 🔵 Part 2: Node.js Setup (Bridge Server)

You need Node.js to run the WebSocket bridge between Minecraft and your browser.

### 1. Install Node.js

* **Windows:**

    * Go to [https://nodejs.org/](https://nodejs.org/)
    * Download the **LTS version** (recommended for stability).
    * Run the installer and follow the defaults (check *"Add to PATH"* when asked).
    * Open **Command Prompt** and check:

      ```
      node -v
      npm -v
      ```

      You should see version numbers.

* **Linux (Debian/Ubuntu):**

  ```
  sudo apt update
  sudo apt install -y nodejs npm
  ```

  Then verify:

  ```
  node -v
  npm -v
  ```

* **Linux (Arch/Manjaro):**

  ```
  sudo pacman -S nodejs npm
  ```

### 2. Get the server script

* Download or copy the `server.js` file into a folder.
* Open the file in a text editor and set your password at the top:

  ```js
  const AUTH_PASSWORD = "yourpassword";
  ```

### 3. Run the server

* Open a terminal (or Command Prompt).
* Navigate to the folder with `server.js`.
* Run:

  ```
  node server.js
  ```
* You should see:

  ```
  WebSocket server listening on port 8080
  ```

---

## 🟡 Part 3: Connect Minecraft to the Server

1. Go back to your Command Computer.
2. Start your script:

   ```
   redstone_control
   ```
3. If it connects successfully, the Node.js terminal will show:

   ```
   New connection from ...
   Minecraft client registered.
   ```

---

## 🔴 Part 4: Connect the Website

1. Open this page in your browser:
   👉 [https://novawolf.me/minecraft/](https://novawolf.me/minecraft/)

2. Click the **⚙️ settings gear**.

3. Enter the connection info:

    * **IP:** `localhost`
    * **Port:** `8080`
    * **Password:** (the one you set in `server.js`)

4. Click **Connect**.

    * If successful, the top bar should say **Connected**.
    * You can now send commands from the web page to Minecraft.

---

## 🛠 Troubleshooting

* If you get `commands is nil` → make sure you used a **Command Computer**, not a normal one.
* If the website can’t connect:

    * Check that Node.js is still running.
    * Make sure firewall/port forwarding allows port `8080`.

---

✅ Done! Now you can also edit the UI with the config editor on the site to customize available commands and buttons.