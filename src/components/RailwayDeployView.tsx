import React, { useState } from 'react';
import {
  Rocket,
  GitBranch,
  Copy,
  Check,
  FileCode,
  Globe,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const RailwayDeployView: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('dockerfile');

  const copyCode = (code: string, fileName: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const dockerfileContent = `# Ubuntu GUI Desktop + Minecraft Bedrock (PE) Server + Playit.gg
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \\
    TZ=Etc/UTC \\
    DISPLAY=:1 \\
    PORT=3000 \\
    BEDROCK_PORT=19132

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    ca-certificates curl wget unzip tar git jq nano \\
    sudo procps net-tools libssl3 libcurl4 xvfb x11vnc \\
    openbox tint2 xterm novnc websockify python3 \\
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \\
    && apt-get install -y nodejs

RUN curl -SsL -o /usr/local/bin/playit \\
    https://github.com/playit-cloud/playit-agent/releases/download/v0.15.26/playit-linux-amd64 \\
    && chmod +x /usr/local/bin/playit

RUN mkdir -p /minecraft-bedrock/worlds /minecraft-bedrock/backups
WORKDIR /minecraft-bedrock

RUN curl -H "User-Agent: Mozilla/5.0" -fsSL \\
    https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-1.21.51.02.zip -o bedrock.zip \\
    || true && if [ -f bedrock.zip ]; then unzip -q bedrock.zip && rm bedrock.zip && chmod +x bedrock_server; fi

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 3000 19132/udp 6080
CMD ["/bin/bash", "/start.sh"]`;

  const startShContent = `#!/usr/bin/env bash
set -e

PORT="\${PORT:-3000}"
NOVNC_PORT="\${NOVNC_PORT:-6080}"
DISPLAY="\${DISPLAY:-:1}"

mkdir -p /minecraft-bedrock/worlds /minecraft-bedrock/backups /root/.config/playit /app/data /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix

# Start Xvfb Virtual Desktop
Xvfb "\${DISPLAY}" -screen 0 1280x720x16 &
sleep 1

# Start Window Manager & noVNC
openbox --display "\${DISPLAY}" &
tint2 -c /dev/null &
x11vnc -display "\${DISPLAY}" -forever -shared -nopw -rfbport 5901 -bg || true
websockify --web /usr/share/novnc "\${NOVNC_PORT}" localhost:5901 &

# Start Playit.gg tunnel agent
playit --secret_path /root/.config/playit/playit.toml > /app/data/playit.log 2>&1 &

# Start Web Control Panel (Aternos-style UI) on Railway PORT
cd /app
node dist/server.cjs`;

  const railwayJsonContent = `{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}`;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Railway Deployment Guide
            </h2>
            <p className="text-[11px] text-slate-500">
              AI Studio ➔ GitHub ➔ Railway Docker Deploy
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions in Hinglish */}
        <div className="mt-3 space-y-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              <span>GitHub Par Export / Push Karein:</span>
            </h3>
            <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
              Google AI Studio ke top-right <strong>Export / Settings</strong> menu se <strong>"Export to GitHub"</strong> ya <strong>"Download ZIP"</strong> choose karein aur apne GitHub repository me push karein. Sabhi files (`Dockerfile`, `start.sh`, `railway.json`, web panel) pehle se hi root me setup hain!
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Railway Par Deploy Karein:</span>
            </h3>
            <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
              <a
                href="https://railway.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 font-semibold inline-flex items-center gap-0.5 underline"
              >
                railway.com <ExternalLink className="w-3 h-3" />
              </a>{' '}
              par login karein ➔ <strong>"New Project"</strong> ➔ <strong>"Deploy from GitHub repo"</strong> select karein. Railway automatically root ke `Dockerfile` ko detect karke build shuru kar dega.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                3
              </span>
              <span>Domain Generate Karein (Web Panel Access):</span>
            </h3>
            <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
              Railway me apne service par click karein ➔ <strong>Settings</strong> ➔ <strong>Networking</strong> ➔ <strong>"Generate Domain"</strong> par click karein. Railway ek public URL dega (jaise <code>xyz.up.railway.app</code>). Is URL ko mobile browser me open karte hi ye Aternos style control panel khul jayega!
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] flex items-center justify-center font-bold">
                4
              </span>
              <span>Playit Tunnel Claim & Connect:</span>
            </h3>
            <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
              Panel ke <strong>Tunnel</strong> tab me generate hua <strong>Claim URL</strong> show hoga. Us link ko claim karke <strong>Done</strong> dabayein. Agar claim link expire ho jaye toh <strong>Change</strong> button dabakar naya link generate karein!
            </p>
          </div>
        </div>
      </div>

      {/* Embedded Configuration Files with One-Click Copy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-slate-700" />
          <span>Configured Deployment Files (Included in Repo):</span>
        </h3>

        {/* Dockerfile Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() =>
              setOpenAccordion(openAccordion === 'dockerfile' ? null : 'dockerfile')
            }
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <span>Dockerfile (Ubuntu GUI + BDS + Playit + Panel)</span>
            {openAccordion === 'dockerfile' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {openAccordion === 'dockerfile' && (
            <div className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono relative">
              <button
                onClick={() => copyCode(dockerfileContent, 'dockerfile')}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
              >
                {copiedFile === 'dockerfile' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
              <pre className="overflow-x-auto max-h-60 scrollbar-thin">
                {dockerfileContent}
              </pre>
            </div>
          )}
        </div>

        {/* start.sh Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() =>
              setOpenAccordion(openAccordion === 'startsh' ? null : 'startsh')
            }
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <span>start.sh (Container Supervisor Script)</span>
            {openAccordion === 'startsh' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {openAccordion === 'startsh' && (
            <div className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono relative">
              <button
                onClick={() => copyCode(startShContent, 'startsh')}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
              >
                {copiedFile === 'startsh' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
              <pre className="overflow-x-auto max-h-60 scrollbar-thin">
                {startShContent}
              </pre>
            </div>
          )}
        </div>

        {/* railway.json Accordion */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() =>
              setOpenAccordion(
                openAccordion === 'railwayjson' ? null : 'railwayjson'
              )
            }
            className="w-full flex items-center justify-between p-2.5 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            <span>railway.json (Railway Builder Schema)</span>
            {openAccordion === 'railwayjson' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {openAccordion === 'railwayjson' && (
            <div className="p-3 bg-slate-900 text-slate-200 text-[11px] font-mono relative">
              <button
                onClick={() => copyCode(railwayJsonContent, 'railwayjson')}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
              >
                {copiedFile === 'railwayjson' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>Copy</span>
              </button>
              <pre className="overflow-x-auto max-h-60 scrollbar-thin">
                {railwayJsonContent}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
