import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type VisitorState = "connecting" | "ringing" | "active" | "declined" | "ended" | "error";
const STORAGE_KEY = "doorbell_signal";

export function VisitorView() {
  const [state, setState] = useState<VisitorState>("connecting");
  const [cameraReady, setCameraReady] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleStorageEvent = useCallback((e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    if (e.newValue === "answered") {
      setState("active");
      timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
    } else if (e.newValue === "declined") { setState("declined"); stopStream(); }
    else if (e.newValue === "ended") { setState("ended"); stopStream(); }
  }, [stopStream]);

  useEffect(() => {
    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [handleStorageEvent]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;
        setCameraReady(true);
        setTimeout(() => { setState("ringing"); localStorage.setItem(STORAGE_KEY, "calling"); }, 1200);
      } catch {
        setErrorMsg("Não foi possível acessar a câmera ou microfone.");
        setState("error");
      }
    };
    initCamera();
    return () => stopStream();
  }, [stopStream]);

  const hangup = () => { localStorage.setItem(STORAGE_KEY, "ended"); setState("ended"); stopStream(); };
  const toggleMic = () => { if (streamRef.current) { streamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; }); setMicOn((m) => !m); } };
  const toggleCam = () => { if (streamRef.current) { streamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; }); setCamOn((c) => !c); } };
  const formatDuration = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #07111f 0%, #0c1e35 60%, #071828 100%)" }} />
      <video ref={myVideoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: state === "active" && cameraReady ? 0.35 : 0.15 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,17,31,0.6) 0%, rgba(7,17,31,0.3) 50%, rgba(7,17,31,0.85) 100%)" }} />

      <AnimatePresence mode="wait">
        {state === "connecting" && (
          <motion.div key="connecting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-5 text-center">
            <motion.div className="w-16 h-16 rounded-full border-2" style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }}
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <div>
              <h2 style={{ color: "#dff0f7" }}>Preparando câmera…</h2>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>Aguarde um momento</p>
            </div>
          </motion.div>
        )}

        {state === "ringing" && (
          <motion.div key="ringing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map((i) => (
                <motion.div key={i} className="absolute rounded-full" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                  animate={{ width: 64 + i * 44, height: 64 + i * 44, opacity: [0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }} />
              ))}
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10" style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.5)" }}>
                <Phone size={28} style={{ color: "#00d4ff" }} />
              </div>
            </div>
            <div>
              <h1 style={{ color: "#dff0f7" }}>Chamando…</h1>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>Aguardando o morador atender</p>
            </div>
            <button onClick={hangup} className="mt-4 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              <PhoneOff size={22} />
            </button>
          </motion.div>
        )}

        {state === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(7,17,31,0.7)", border: "1px solid rgba(0,212,255,0.2)" }}>
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm tabular-nums" style={{ color: "#dff0f7", fontFamily: "monospace" }}>{formatDuration(callDuration)}</span>
              </div>
              <span className="text-sm" style={{ color: "#6b90a8" }}>Chamada ativa</span>
            </div>
            <div className="rounded-2xl p-4 border flex flex-col gap-4" style={{ background: "rgba(12,26,46,0.85)", borderColor: "rgba(0,212,255,0.2)" }}>
              <p className="text-sm text-center" style={{ color: "#6b90a8" }}>Conectado com o morador</p>
              <div className="w-full aspect-video rounded-xl overflow-hidden relative" style={{ background: "#000d1a" }}>
                <video autoPlay playsInline muted ref={myVideoRef} className="w-full h-full object-cover" />
                {!camOn && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#000d1a" }}>
                    <VideoOff size={24} style={{ color: "#6b90a8" }} />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-4 pt-1">
                <button onClick={toggleMic} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: micOn ? "rgba(0,212,255,0.1)" : "rgba(239,68,68,0.15)", border: `1px solid ${micOn ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.4)"}`, color: micOn ? "#00d4ff" : "#ef4444" }}>
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button onClick={hangup} className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                  <PhoneOff size={22} />
                </button>
                <button onClick={toggleCam} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: camOn ? "rgba(0,212,255,0.1)" : "rgba(239,68,68,0.15)", border: `1px solid ${camOn ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.4)"}`, color: camOn ? "#00d4ff" : "#ef4444" }}>
                  {camOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {(state === "declined" || state === "ended" || state === "error") && (
          <motion.div key={state} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: state === "error" || state === "declined" ? "rgba(239,68,68,0.1)" : "rgba(0,212,255,0.08)", border: `1px solid ${state === "error" || state === "declined" ? "rgba(239,68,68,0.3)" : "rgba(0,212,255,0.25)"}` }}>
              {state === "ended" ? <Phone size={28} style={{ color: "#00d4ff" }} /> : <PhoneOff size={28} style={{ color: "#ef4444" }} />}
            </div>
            <div>
              <h2 style={{ color: "#dff0f7" }}>
                {state === "declined" ? "Chamada não atendida" : state === "ended" ? "Chamada encerrada" : "Erro de câmera"}
              </h2>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>
                {state === "declined" ? "O morador está indisponível no momento." : state === "ended" ? `Duração: ${formatDuration(callDuration)}` : errorMsg}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 flex items-center gap-2 opacity-40">
        <Phone size={14} style={{ color: "#00d4ff" }} />
        <span className="text-xs uppercase tracking-widest" style={{ color: "#6b90a8" }}>DoorLink</span>
      </div>
    </div>
  );
}
