# ====================================================================
# Ubuntu GUI Desktop (XFCE4/VNC/noVNC) + Bedrock Server + Playit.gg + Control Panel
# Optimized for Railway Cloud Deployment & BuildKit
# ====================================================================
FROM --platform=linux/amd64 ubuntu:22.04

LABEL maintainer="Bedrock Server Panel"
LABEL description="Ubuntu Desktop GUI (XFCE4 + noVNC), Minecraft Bedrock Dedicated Server, Playit.gg, and Mobile Web Panel"

# Prevent interactive prompts during installation & setup base environment
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Etc/UTC \
    USER=root \
    HOME=/root \
    DISPLAY=:1 \
    VNC_PORT=5901 \
    NOVNC_PORT=6080 \
    PORT=3000 \
    BEDROCK_PORT=19132 \
    PLAYIT_CONFIG_DIR=/root/.config/playit

WORKDIR /app

# 1. Install Base Packages, Desktop Environment (XFCE4), VNC, openssl & noVNC
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    unzip \
    tar \
    git \
    jq \
    nano \
    sudo \
    procps \
    net-tools \
    openssl \
    libssl3 \
    libcurl4 \
    libcap2-bin \
    libc6 \
    dbus-x11 \
    x11-utils \
    x11-xserver-utils \
    xfce4 \
    xfce4-terminal \
    tigervnc-standalone-server \
    novnc \
    websockify \
    python3 \
    python3-numpy \
    && rm -rf /var/lib/apt/lists/*

# Setup Xauthority & default index for noVNC
RUN touch /root/.Xauthority && \
    mkdir -p /root/.vnc /usr/share/novnc && \
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html || true

# 2. Install Node.js 20 LTS for the Web Control Panel
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 3. Install Playit.gg Tunnel Agent
RUN curl -SsL -o /usr/local/bin/playit https://github.com/playit-cloud/playit-agent/releases/download/v0.15.26/playit-linux-amd64 \
    && chmod +x /usr/local/bin/playit

# 4. Prepare Minecraft Bedrock Dedicated Server Directory & download binary
RUN mkdir -p /minecraft-bedrock /minecraft-bedrock/worlds /minecraft-bedrock/backups
WORKDIR /minecraft-bedrock

RUN (curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -fsSL https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.21.62.01.zip -o bedrock.zip \
    || curl -fsSL https://raw.githubusercontent.com/TheRemote/MinecraftBedrockServer/master/bedrock-server-1.21.62.01.zip -o bedrock.zip \
    || curl -H "User-Agent: Mozilla/5.0" -fsSL https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.21.60.10.zip -o bedrock.zip \
    || true) \
    && if [ -f bedrock.zip ]; then unzip -q bedrock.zip && rm -f bedrock.zip && chmod +x bedrock_server || true; fi

# Create lightweight Bedrock server.properties (with cheats disabled by default and texturepack-required=true)
RUN printf "server-name=My Bedrock Server\ngamemode=survival\ndifficulty=normal\nallow-cheats=false\nmax-players=8\nonline-mode=false\nwhite-list=false\nserver-port=19132\nserver-portv6=19133\nview-distance=10\ntick-distance=4\nplayer-idle-timeout=15\nmax-threads=2\nlevel-name=BedrockLevel\nlevel-seed=\ndefault-player-permission-level=member\ntexturepack-required=true\ncontent-log-file-enabled=true\nserver-authoritative-movement=server-auth\nplayer-movement-score-threshold=20\nserver-authoritative-block-breaking=true\n" > /minecraft-bedrock/server.properties \
    && printf '{"version":"1.21.62.01","updatedAt":"%s"}' "$(date -u +%%Y-%%m-%%dT%%H:%%M:%%SZ)" > /minecraft-bedrock/version.json

# 5. Build and Setup Web Control Panel (with devDependencies for vite/esbuild)
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev --legacy-peer-deps --no-audit

COPY . .
RUN npm run build

# Set production environment for runtime
ENV NODE_ENV=production

# 6. Setup startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Expose Web Panel (3000), noVNC GUI (6080), VNC (5901), and Bedrock UDP (19132)
EXPOSE 3000 6080 5901 19132/udp

CMD ["/bin/bash", "/start.sh"]
