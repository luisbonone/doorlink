import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Bell, Wifi, Shield, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const ROOM_URL = import.meta.env.VITE_DAILY_ROOM_URL as string;

export function HomeView() {
  const [inCall, setInCall] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d: Date) =>
    d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #07111f 0%, #0c1e35 60%, #071828 100%)" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}>
            <Bell size={16} style={{ color: "#00d4ff" }} />
          </div>
          <span style={{ color: "#dff0f7", letterSpacing: "0.05em" }} className="uppercase text-sm">DoorLink</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: "#6b90a8" }}>Online</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "#6b90a8" }}>
            <Wifi size={14} /><Shield size={14} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Left panel */}
        <div className="flex flex-col gap-5 w-72 shrink-0">
          <div className="rounded-2xl p-5 border border-border" style={{ background: "rgba(12,26,46,0.8)" }}>
            <div className="text-4xl tabular-nums mb-1" style={{ color: "#00d4ff", fontFamily: "monospace" }}>{formatTime(currentTime)}</div>
            <div className="text-sm capitalize" style={{ color: "#6b90a8" }}>{formatDate(currentTime)}</div>
          </div>

          <div className="rounded-2xl p-5 border border-border" style={{ background: "rgba(12,26,46,0.8)" }}>
            <div className="text-xs uppercase tracking-widest mb-4" style={{ color: "#6b90a8" }}>QR Code da Porta</div>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-xl" style={{ background: "#ffffff" }}>
                {ROOM_URL ? (
                  <QRCodeSVG value={ROOM_URL} size={160} bgColor="#ffffff" fgColor="#07111f" level="H" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-xs text-center p-4" style={{ color: "#6b90a8" }}>
                    Configure VITE_DAILY_ROOM_URL no Vercel
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-center leading-relaxed" style={{ color: "#6b90a8" }}>
              O visitante escaneia, entra na sala e você atende clicando em "Entrar na chamada".
            </p>
          </div>

          <div className="rounded-2xl p-5 border border-border" style={{ background: "rgba(12,26,46,0.8)" }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6b90a8" }}>Status</div>
            <div className="space-y-3">
              {[
                { label: "Sala", value: ROOM_URL ? "Configurada" : "Pendente" },
                { label: "Protocolo", value: "WebRTC" },
                { label: "Criptografia", value: "E2E" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#6b90a8" }}>{item.label}</span>
                  <span className="text-sm" style={{ color: "#dff0f7" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {!inCall ? (
              <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-border gap-6"
                style={{ background: "rgba(12,26,46,0.8)" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <Bell size={36} style={{ color: "rgba(0,212,255,0.4)" }} />
                </div>
                <div className="text-center">
                  <h2 className="mb-2" style={{ color: "#dff0f7" }}>Aguardando visitantes</h2>
                  <p className="text-sm" style={{ color: "#6b90a8" }}>Quando alguém escanear o QR code, entre na chamada abaixo.</p>
                </div>
                <button
                  onClick={() => setInCall(true)}
                  disabled={!ROOM_URL}
                  className="flex items-center gap-3 px-8 py-4 rounded-full transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "#00d4ff", color: "#07111f" }}
                >
                  <Phone size={20} />
                  <span className="font-medium">Entrar na chamada</span>
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm" style={{ color: "#6b90a8" }}>Sistema ativo — powered by Daily.co</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-border">
                <iframe
                  src={ROOM_URL}
                  allow="camera; microphone; fullscreen; display-capture"
                  className="flex-1 w-full border-0"
                  style={{ minHeight: 500 }}
                />
                <div className="flex items-center justify-center py-3 border-t border-border" style={{ background: "rgba(12,26,46,0.9)" }}>
                  <button
                    onClick={() => setInCall(false)}
                    className="text-sm px-5 py-2 rounded-full transition-all hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                  >
                    Sair da chamada
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
