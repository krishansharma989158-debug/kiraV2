import React, { useState } from 'react';
import {
  Radio,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { ServerData } from '../types';

interface PlayitTunnelViewProps {
  serverData: ServerData | null;
  onDoneClaim: () => Promise<void>;
  onChangeClaim: () => Promise<void>;
  loading: boolean;
}

export const PlayitTunnelView: React.FC<PlayitTunnelViewProps> = ({
  serverData,
  onDoneClaim,
  onChangeClaim,
  loading
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  if (!serverData) return null;

  const playit = serverData.playit;
  const isClaimed = playit.claimStatus === 'claimed';

  const copyText = (text: string, type: 'url' | 'addr') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleDone = async () => {
    await onDoneClaim();
    setActionSuccessMsg('Tunnel claim confirmed! Secure connection established.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleChange = async () => {
    await onChangeClaim();
    setActionSuccessMsg('New claim link generated successfully! Open and claim it.');
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-3.5 pb-6">
      {/* Playit Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Playit.gg Tunnel Manager
              </h2>
              <p className="text-[11px] text-slate-500">
                Public UDP tunnel for Minecraft Bedrock (PE)
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isClaimed
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isClaimed ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
              }`}
            />
            <span>{isClaimed ? 'Connected' : 'Waiting for Claim'}</span>
          </span>
        </div>

        {/* Action success alert */}
        {actionSuccessMsg && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Tunnel Claim Box */}
        <div className="mt-3.5 space-y-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">Claim URL:</span>
              <span className="text-[10px] text-slate-400 font-mono">
                Code: {playit.claimCode}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                value={playit.claimUrl}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 select-all"
              />
              <button
                onClick={() => copyText(playit.claimUrl, 'url')}
                title="Copy Claim Link"
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 active:bg-slate-100 transition-colors shrink-0"
              >
                {copiedUrl ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={playit.claimUrl}
                target="_blank"
                rel="noreferrer"
                title="Open Link in New Tab"
                className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-sky-700 hover:bg-sky-100 transition-colors shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Playit.gg par is link ko open karke claim karein. Claim karne ke baad neeche{' '}
              <strong className="text-slate-800 font-semibold">Done</strong> button par click karein. Agar link expire ho gaya ho toh{' '}
              <strong className="text-slate-800 font-semibold">Change</strong> par click karein.
            </p>
          </div>

          {/* 2 Explicit Buttons: Done & Change */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Done Button */}
            <button
              onClick={handleDone}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all text-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done (Claimed)</span>
            </button>

            {/* Change Button */}
            <button
              onClick={handleChange}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 border border-slate-200 transition-all text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Change (Re-generate)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Established Tunnel Connection Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Tunnel Configuration</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Tunnel Bedrock IP:</span>
            <div className="flex items-center gap-1.5 font-mono font-semibold text-slate-900">
              <span>{playit.tunnelAddress}</span>
              <button
                onClick={() => copyText(playit.tunnelAddress, 'addr')}
                className="p-1 hover:bg-slate-200 rounded text-slate-600"
              >
                {copiedAddr ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Bedrock Port:</span>
            <span className="font-mono font-semibold text-slate-900">
              {playit.tunnelPort}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Protocol:</span>
            <span className="font-semibold text-slate-800">{playit.protocol}</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium">Tunnel Health / Ping:</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              {playit.pingMs} ms
            </span>
          </div>
        </div>
      </div>

      {/* Hindi & English Helper Card */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 space-y-2">
        <h4 className="font-bold text-sky-950 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-sky-600" />
          <span>Kaise Connect Karein (Step by Step):</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-sky-800 leading-relaxed">
          <li>Upar diye gaye <strong>Claim URL</strong> ko apne browser me open karein.</li>
          <li>Playit account se claim confirm karein (Bedrock UDP tunnel auto create ho jayega).</li>
          <li>Wapas aakar <strong>"Done (Claimed)"</strong> button par click karein.</li>
          <li>Agar link expire ho gaya ho toh <strong>"Change (Re-generate)"</strong> dabayein, naya link ban jayega.</li>
          <li>Ab Minecraft PE me jakar Server IP & Port add karein aur join karein!</li>
        </ol>
      </div>
    </div>
  );
};
