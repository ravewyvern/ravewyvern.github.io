-- command_runner.lua
-- Place in a CC:Tweaked (Computer/Advanced Computer)
-- Make sure http_enable = true and http_websocket_enable = true in computercraft config
-- Also enable "command computer" capability in config if using commands.exec

local SERVER = "ws://localhost:8080" -- change to your server (e.g. ws://1.2.3.4:8080)
local MC_PASSWORD = "minecraftpenispenispenis" -- must match server's MC_PASSWORD

-- connect
local ws, err = http.websocket(SERVER)
if not ws then
    print("Failed to connect to " .. SERVER .. " : " .. tostring(err))
    return
    end
    print("Connected to bridge at " .. SERVER)

    -- register as MC client
    ws.send("register:minecraft:" .. MC_PASSWORD)

    -- main loop: receive commands from bridge and execute them
    while true do
        local msg = ws.receive()
        if not msg then
            print("Connection closed by server")
            break
            end

            -- ignore ping/pong or simple messages
            if msg == "ping" then
                ws.send("pong")
                else
                    -- msg is expected to be a raw Minecraft command string, e.g. "say hello" or "gamemode creative Player"
                    print("Received command: " .. msg)
                    local success, res = pcall(function()
                    -- commands.exec will run a server command (requires command computer enable and proper perms)
                    return commands.exec(msg)
                    end)

                    if success then
                        ws.send("Executed: " .. msg)
                        print("Executed: " .. msg)
                        else
                            ws.send("Error executing: " .. tostring(res))
                            print("Error executing: " .. tostring(res))
                            end
                            end
                            end

                            ws.close()
