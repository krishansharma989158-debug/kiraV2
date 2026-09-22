import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Globe,
  CheckCircle2,
  Terminal
} from 'lucide-react';

interface DesktopViewProps {
  desktopUrl?: string;
  isOnline: boolean;
}

export const DesktopView: React.FC<DesktopViewProps> = ({
  desktopUrl,
  isOnline
}) => {
  // If user generated a domain for port 6080 on Railway, they can enter it or use current hostname
  const [novncUrl, setNovncUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // If deployed on Railway
      if (hostname.includes('railway.app') || hostname.includes('up.railway.app')) {
        // Saved or suggested Railway port 6080 domain
        const savedUrl = localStorage.getItem('railway_novnc_domain');
        if (savedUrl) {
          setNovncUrl(savedUrl);
        } else {
          // Suggest port 6080 URL based on current domain name
          setNovncUrl(`${protocol}//${hostname}`);
        }
      } else {
        setNovncUrl(`http://${hostname}:6080/vnc.html?autoconnect=true`);
      }
    }
  }, []);

  const handleSaveDomain = (url: string) => {
    setNovncUrl(url);
    localStorage.setItem('railway_novnc_domain', url);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Ubuntu XFCE4 GUI Desktop
              </h2>
              <p className="text-[11px] text-slate-500">
                TigerVNC (:1) • noVNC Web Display (Port 6080)
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Port 6080 Active</span>
          </span>
        </div>

        {/* Port 6080 Domain Bar */}
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Railway Port 6080 Domain:</span>
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {showConfig ? 'Hide Config' : 'Change Domain'}
            </button>
          </div>

          {showConfig ? (
            <div className="space-y-1.5 pt-1">
              <input
                type="text"
                value={novncUrl}
                onChange={(e) => handleSaveDomain(e.target.value)}
                placeholder="https://your-6080-domain.up.railway.app"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[10px] text-slate-500">
                Railway Networking tab me banaye gaye <strong>Port 6080</strong> domain ko yahan paste karein.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 truncate">
              <span className="truncate">{novncUrl || 'Port 6080 Web Terminal'}</span>
              <button
                onClick={() => handleCopy(novncUrl)}
                className="ml-2 text-slate-400 hover:text-slate-700 shrink-0 font-sans text-[10px] font-bold"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Live noVNC Desktop Screen Viewer / Iframe */}
        <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950 aspect-video flex flex-col shadow-inner">
          {/* Virtual Desktop Window Bar */}
          <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono text-[10px] text-slate-400 pl-1">
                Ubuntu 22.04 LTS (TigerVNC + XFCE4)
              </span>
            </div>
            {novncUrl && (
              <a
                href={novncUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Open in new window"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Embedded noVNC frame or preview screen */}
          <div className="flex-1 bg-slate-900 relative flex items-center justify-center">
            {novncUrl ? (
              <iframe
                src={novncUrl}
                title="Ubuntu Desktop GUI"
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write; fullscreen"
              />
            ) : (
              <div className="text-center p-4">
                <Monitor className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs text-slate-300 font-medium">
                  Ubuntu Desktop running on Port 6080
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Click the button below to open XFCE4 desktop directly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <a
            href={novncUrl || '#'}
            target="_blank"
            rel="noreferrer"
            className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Desktop in Tab</span>
          </a>

          <button
            onClick={() => {
              alert('VNC Info:\n• Port: 6080 (Web / noVNC) or 5901 (VNC)\n• Security: Passwordless shared session\n• Desktop: XFCE4 on Ubuntu 22.04');
            }}
            className="bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>VNC Specs</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2 text-xs">
        <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Railway Dual-Port Architecture:</span>
        </h3>
        <div className="space-y-1.5 text-slate-600 text-[11px]">
          <p>
            <strong>Port 3000:</strong> Web Control Panel (Aapka UPI-style mobile dashboard jahan se server on/off, console, worlds manage hote hain).
          </p>
          <p>
            <strong>Port 6080:</strong> Ubuntu XFCE4 Desktop RDP (Direct browser me graphical Linux desktop terminal, files aur tools chalane ke liye).
          </p>
          <p>
            <strong>Port 19132 (UDP):</strong> Minecraft Bedrock Dedicated Server (Playit.gg public tunnel se tunnelled).
          </p>
        </div>
      </div>
    </div>
  );
};
