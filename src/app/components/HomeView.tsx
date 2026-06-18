import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Phone, PhoneOff, Bell, Wifi, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { getOrCreateRoom } from "../services/daily";

type CallState = "idle" | "ringing" | "active";

export function HomeView() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [roomUrl, setRoomUrl] = useState("");
  const [visitorName, setVisitorName] = useState("Visitante");

  const callRef = useRef<DailyCall | null>(null);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const visitorVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visitorUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname.replace(/\/$/, "")}#/visit`
    : "";

  useEffect(() => {
    const tick = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    getOrCreateRoom().then(setRoomUrl).catch(console.error);
  }, []);

  const updateVideoTracks = useCallback((call: DailyCall) => {
    const participants = call.participants();
    // Local (homeowner)
    const local = participants.local;
    if (local?.tracks?.video?.persistentTrack && myVideoRef.current) {
      myVideoRef.current.srcObject = new MediaStream([local.tracks.video.persistentTrack]);
    }
    // Remote (visitor)
    const remoteIds = Object.keys(participants).filter((id) => id !== "local");
    if (remoteIds.length > 0) {
      const remote = participants[remoteIds[0]];
      if (remote?.tracks?.video?.persistentTrack && visitorVideoRef.current) {
        visitorVideoRef.current.srcObject = new MediaStream([remote.tracks.video.persistentTrack]);
      }
    }
  }, []);

  const endCall = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState("idle");
    setCallDuration(0);
  }, []);

  // Join room silently to monitor for visitors
  useEffect(() => {
    if (!roomUrl) return;

    const call = DailyIframe.createCallObject({ audioSource: false, videoSource: false });
    callRef.current = call;

    call.join({ url: roomUrl, userName: "Morador" }).catch(console.error);

    call.on("participant-joined", (event) => {
      if (event?.participant?.local) return;
      setVisitorName(event?.participant?.user_name || "Visitante");
      setCallState("ringing");
    });

    call.on("participant-left", () => {
      const remotes = Object.keys(call.participants()).filter((id) => id !== "local");
      if (remotes.length === 0) endCall();
    });

    call.on("track-started", () => updateVideoTracks(call));

    return () => {
      call.leave().then(() => call.destroy());
    };
  }, [roomUrl, endCall, updateVideoTracks]);

  const answer = async () => {
    if (!callRef.current) return;
    setCallState("active");
    await callRef.current.setLocalAudio(true);
    await callRef.current.setLocalVideo(true);
    updateVideoTracks(callRef.current);
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  };

  const decline = () => {
    endCall();
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
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
            <div className={`w-2 h-2 rounded-full ${roomUrl ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
            <span className="text-xs" style={{ color: "#6b90a8" }}>{roomUrl ? "Online" : "Conectando..."}</span>
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
                {visitorUrl ? (
                  <QRCodeSVG value={visitorUrl} size={160} bgColor="#ffffff" fgColor="#07111f" level="H" />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center" style={{ color: "#6b90a8" }}>Carregando...</div>
                )}
              </div>
            </div>
            <p className="text-xs text-center leading-relaxed" style={{ color: "#6b90a8" }}>
              Visitantes escaneiam este código e a videochamada inicia automaticamente.
            </p>
            <div className="mt-3 p-2 rounded-lg text-xs text-center break-all" style={{ background: "rgba(0,212,255,0.06)", color: "#6b90a8", fontFamily: "monospace" }}>
              {visitorUrl}
            </div>
          </div>

          <div className="rounded-2xl p-5 border border-border" style={{ background: "rgba(12,26,46,0.8)" }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6b90a8" }}>Status</div>
            <div className="space-y-3">
              {[
                { label: "Sala", value: roomUrl ? "Ativa" : "Criando..." },
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
            {callState === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-border" style={{ background: "rgba(12,26,46,0.8)" }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <Bell size={36} style={{ color: "rgba(0,212,255,0.4)" }} />
                </div>
                <h2 className="mb-2" style={{ color: "#dff0f7" }}>Aguardando visitantes</h2>
                <p className="text-sm" style={{ color: "#6b90a8" }}>Quando alguém escanear o QR code, você receberá a chamada aqui.</p>
                <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm" style={{ color: "#6b90a8" }}>Sistema ativo — chamadas via Daily.co</span>
                </div>
              </motion.div>
            )}

            {callState === "ringing" && (
              <motion.div key="ringing" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                className="flex-1 flex flex-col items-center justify-center rounded-2xl border" style={{ background: "rgba(12,26,46,0.95)", borderColor: "rgba(0,212,255,0.3)" }}>
                <div className="relative flex items-center justify-center mb-8">
                  {[1, 2, 3].map((i) => (
                    <motion.div key={i} className="absolute rounded-full border" style={{ borderColor: "rgba(0,212,255,0.25)" }}
                      animate={{ width: 80 + i * 48, height: 80 + i * 48, opacity: [0.6, 0] }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }} />
                  ))}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center relative z-10" style={{ background: "rgba(0,212,255,0.15)", border: "2px solid #00d4ff" }}>
                    <Phone size={32} style={{ color: "#00d4ff" }} />
                  </div>
                </div>
                <h2 className="mb-1" style={{ color: "#dff0f7" }}>Chamada recebida</h2>
                <p className="text-sm mb-10" style={{ color: "#6b90a8" }}>{visitorName} está na porta</p>
                <div className="flex items-center gap-6">
                  <button onClick={decline} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                    <PhoneOff size={24} />
                  </button>
                  <button onClick={answer} className="w-20 h-20 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: "#00d4ff", color: "#07111f" }}>
                    <Phone size={28} />
                  </button>
                </div>
                <div className="mt-4 flex gap-8 text-sm" style={{ color: "#6b90a8" }}>
                  <span>Recusar</span><span style={{ marginLeft: "2.5rem" }}>Atender</span>
                </div>
              </motion.div>
            )}

            {callState === "active" && (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-border">
                <div className="flex-1 relative flex items-center justify-center" style={{ background: "#000d1a" }}>
                  <video ref={visitorVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(7,17,31,0.8)", border: "1px solid rgba(0,212,255,0.2)" }}>
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-sm tabular-nums" style={{ color: "#dff0f7", fontFamily: "monospace" }}>{formatDuration(callDuration)}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border" style={{ borderColor: "rgba(0,212,255,0.3)", background: "#000d1a" }}>
                    <video ref={myVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute top-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(7,17,31,0.7)", color: "#6b90a8" }}>Você</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 py-4 border-t border-border" style={{ background: "rgba(12,26,46,0.9)" }}>
                  <button onClick={endCall} className="flex items-center gap-2 px-6 py-3 rounded-full transition-all hover:scale-105"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                    <PhoneOff size={18} /><span>Encerrar</span>
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
