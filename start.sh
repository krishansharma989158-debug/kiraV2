#!/usr/bin/env bash

echo "=========================================================="
echo "🚀 Starting Bedrock Server Panel + Ubuntu XFCE4 GUI + Playit"
echo "=========================================================="

# Export critical environment variables
export NODE_ENV=production
export USER=root
export HOME=/root
export DISPLAY=:1
export PORT=3000
export NOVNC_PORT=6080

mkdir -p /minecraft-bedrock/worlds /minecraft-bedrock/backups /root/.config/playit /app/data /tmp/.X11-unix /root/.vnc
chmod 1777 /tmp/.X11-unix
touch /root/.Xauthority

# Clean up any leftover X11 or VNC locks from previous runs
echo "[GUI] Cleaning up stale locks..."
vncserver -kill :1 >/dev/null 2>&1 || true
rm -rf /tmp/.X1-lock /tmp/.X11-unix/X1 /tmp/.X11-unix/X11

# 1. Setup VNC xstartup to directly launch XFCE4 Desktop
cat << 'EOF' > /root/.vnc/xstartup
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startxfce4
EOF
chmod +x /root/.vnc/xstartup

# 2. Start TigerVNC Server on Display :1 (Port 5901)
echo "[GUI] Starting TigerVNC server on :1 (Port 5901)..."
vncserver :1 -localhost no -SecurityTypes None -geometry 1024x768 -depth 16 --I-KNOW-THIS-IS-INSECURE || echo "[WARN] TigerVNC started"

# 3. Setup autoconnect redirect in noVNC web directory
mkdir -p /usr/share/novnc
cat << 'EOF' > /usr/share/novnc/index.html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=vnc.html?autoconnect=true&resize=scale">
  <title>Ubuntu Desktop GUI</title>
</head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
  <h2>Connecting to Ubuntu XFCE4 Desktop...</h2>
  <p><a href="vnc.html?autoconnect=true&resize=scale" style="color:#38bdf8;">Click here if not redirected automatically</a></p>
</body>
</html>
EOF

# 4. Start noVNC Websockify Bridge (Port 6080 -> 5901)
# Note: In Railway, Railway provides the public SSL certificate on the domain.
# Websockify listens on plain HTTP/WS so Railway edge proxy connects directly without TLS handshake conflicts!
echo "[GUI] Starting noVNC websockify bridge on port ${NOVNC_PORT}..."
pkill -f websockify 2>/dev/null || true
websockify -D --web=/usr/share/novnc/ "${NOVNC_PORT}" localhost:5901

# 5. Initialize Playit.gg tunnel agent in background
echo "[TUNNEL] Initializing Playit.gg CLI..."
if [ ! -f /root/.config/playit/playit.toml ]; then
  echo "[TUNNEL] Starting playit agent to generate claim token..."
  playit --secret_path /root/.config/playit/playit.toml > /app/data/playit.log 2>&1 &
else
  echo "[TUNNEL] Existing playit configuration found. Connecting..."
  playit --secret_path /root/.config/playit/playit.toml >> /app/data/playit.log 2>&1 &
fi

# 6. Tune Bedrock server.properties to lightweight profile (prevents Railway OOM)
if [ -f /minecraft-bedrock/server.properties ]; then
  sed -i 's/view-distance=.*/view-distance=10/' /minecraft-bedrock/server.properties
  sed -i 's/max-threads=.*/max-threads=2/' /minecraft-bedrock/server.properties
  sed -i 's/max-players=.*/max-players=8/' /minecraft-bedrock/server.properties
  sed -i 's/player-idle-timeout=.*/player-idle-timeout=15/' /minecraft-bedrock/server.properties
fi

# 7. Ensure Bedrock Linux binary is downloaded if missing
if [ ! -f /minecraft-bedrock/bedrock_server ]; then
  echo "[BEDROCK] Downloading official Bedrock Dedicated Server..."
  cd /minecraft-bedrock
  curl -H "User-Agent: Mozilla/5.0" -fsSL https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.21.51.02.zip -o bedrock.zip \
    || curl -fsSL https://raw.githubusercontent.com/TheRemote/MinecraftBedrockServer/master/bedrock-server-1.21.50.07.zip -o bedrock.zip \
    || true
  if [ -f bedrock.zip ]; then
    unzip -q -o bedrock.zip && rm -f bedrock.zip && chmod +x bedrock_server || true
  fi
fi

# 8. Start Web Control Panel on Port 3000
echo "[PANEL] Starting Bedrock Web Control Panel on port 3000..."
cd /app

if [ ! -f dist/server.cjs ]; then
  echo "[PANEL] Compiling panel server..."
  npm run build || true
fi

echo "[PANEL] Launching Node.js Express server on port 3000..."
exec node --max-old-space-size=128 dist/server.cjs
