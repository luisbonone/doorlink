import { useEffect, useRef, useState, useCallback } from "react";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { getOrCreateRoom } from "../services/daily";

type VisitorState = "connecting" | "waiting" | "active" | "ended" | "error";

export function VisitorView() {
  const [state, setState] = useState<VisitorState>("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateVideoTracks = useCallback((call: DailyCall) => {
    const participants = call.participants();
    const local = participants.local;
    if (local?.tracks?.video?.persistentTrack && myVideoRef.current) {
      myVideoRef.current.srcObject = new MediaStream([local.tracks.video.persistentTrack]);
    }
    const remoteIds = Object.keys(participants).filter((id) => id !== "local");
    if (remoteIds.length > 0) {
      const remote = participants[remoteIds[0]];
      if (remote?.tracks?.video?.persistentTrack && hostVideoRef.current) {
        hostVideoRef.current.srcObject = new MediaStream([remote.tracks.video.persistentTrack]);
      }
    }
  }, []);

  const leave = useCallback(() => {
    if (callRef.current) {
      callRef.current.leave();
      callRef.current.destroy();
      callRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setState("ended");
  }, []);

  useEffect(() => {
    const join = async () => {
      try {
        const roomUrl = await getOrCreateRoom();
        const call = DailyIframe.createCallObject();
        callRef.current = call;

        await call.join({ url: roomUrl, userName: "Visitante" });
        setState("waiting");

        call.on("participant-joined", (event) => {
          if (event?.participant?.local) return;
          // Host joined — call is now active
          setState("active");
          timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
          updateVideoTracks(call);
        });

        call.on("participant-left", (event) => {
          if (event?.participant?.local) return;
          leave();
        });

        call.on("track-started", () => updateVideoTracks(call));

        updateVideoTracks(call);
      } catch (e) {
        console.error(e);
        setErrorMsg("Não foi possível conectar. Verifique sua câmera e tente novamente.");
        setState("error");
      }
    };
    join();
    return () => { leave(); };
  }, [leave, updateVideoTracks]);

  const toggleMic = async () => {
    if (!callRef.current) return;
    await callRef.current.setLocalAudio(!micOn);
    setMicOn((m) => !m);
  };

  const toggleCam = async () => {
    if (!callRef.current) return;
    await callRef.current.setLocalVideo(!camOn);
    setCamOn((c) => !c);
  };

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #07111f 0%, #0c1e35 60%, #071828 100%)" }} />

      {/* My camera background */}
      <video ref={myVideoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: state === "active" ? 0.3 : 0.12 }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,17,31,0.65) 0%, rgba(7,17,31,0.25) 50%, rgba(7,17,31,0.9) 100%)" }} />

      <AnimatePresence mode="wait">
        {state === "connecting" && (
          <motion.div key="connecting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-5 text-center">
            <motion.div className="w-16 h-16 rounded-full border-2"
              style={{ borderColor: "#00d4ff", borderTopColor: "transparent" }}
              animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
            <div>
              <h2 style={{ color: "#dff0f7" }}>Conectando…</h2>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>Iniciando câmera e acessando a sala</p>
            </div>
          </motion.div>
        )}

        {state === "waiting" && (
          <motion.div key="waiting" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-6 text-center">
            <div className="relative flex items-center justify-center">
              {[1, 2, 3].map((i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                  animate={{ width: 64 + i * 44, height: 64 + i * 44, opacity: [0.8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }} />
              ))}
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                style={{ background: "rgba(0,212,255,0.12)", border: "2px solid rgba(0,212,255,0.5)" }}>
                <Phone size={28} style={{ color: "#00d4ff" }} />
              </div>
            </div>
            <div>
              <h1 style={{ color: "#dff0f7" }}>Chamando…</h1>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>Aguardando o morador atender</p>
            </div>
            <button onClick={leave} className="mt-2 w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              <PhoneOff size={22} />
            </button>
          </motion.div>
        )}

        {state === "active" && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full max-w-sm flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: "rgba(7,17,31,0.7)", border: "1px solid rgba(0,212,255,0.2)" }}>
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-sm tabular-nums" style={{ color: "#dff0f7", fontFamily: "monospace" }}>{formatDuration(callDuration)}</span>
              </div>
              <span className="text-sm" style={{ color: "#6b90a8" }}>Chamada ativa</span>
            </div>

            {/* Host video */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden border" style={{ background: "#000d1a", borderColor: "rgba(0,212,255,0.2)" }}>
              <video ref={hostVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-center gap-4">
              <button onClick={toggleMic} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ background: micOn ? "rgba(0,212,255,0.1)" : "rgba(239,68,68,0.15)", border: `1px solid ${micOn ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.4)"}`, color: micOn ? "#00d4ff" : "#ef4444" }}>
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button onClick={leave} className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
                <PhoneOff size={22} />
              </button>
              <button onClick={toggleCam} className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
                style={{ background: camOn ? "rgba(0,212,255,0.1)" : "rgba(239,68,68,0.15)", border: `1px solid ${camOn ? "rgba(0,212,255,0.3)" : "rgba(239,68,68,0.4)"}`, color: camOn ? "#00d4ff" : "#ef4444" }}>
                {camOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>
          </motion.div>
        )}

        {state === "ended" && (
          <motion.div key="ended" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.25)" }}>
              <Phone size={28} style={{ color: "#00d4ff" }} />
            </div>
            <div>
              <h2 style={{ color: "#dff0f7" }}>Chamada encerrada</h2>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>Duração: {formatDuration(callDuration)}</p>
            </div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div key="error" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <PhoneOff size={28} style={{ color: "#ef4444" }} />
            </div>
            <div>
              <h2 style={{ color: "#dff0f7" }}>Erro de conexão</h2>
              <p className="text-sm mt-1" style={{ color: "#6b90a8" }}>{errorMsg}</p>
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
