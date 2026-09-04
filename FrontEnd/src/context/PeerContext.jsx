import { createContext, useContext, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer/simplepeer.min.js";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const PeerContext = createContext();

const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject"
    },
    {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject"
    }
];

export const PeerProvider = ({ children }) => {
    const navigate = useNavigate();
    const { emit, on, off } = useSocket();

    const peerRef = useRef(null);
    const outgoingCallRef = useRef(null);
    const incomingCallRef = useRef(null);
    const pendingSignalsRef = useRef([]);

    // State variables
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [calling, setCalling] = useState(false);
    const [incomingCall, setIncomingCall] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null);
    const [callerId, setCallerId] = useState(null);
    const [calleeId, setCalleeId] = useState(null);
    const [isCallAccepted, setIsCallAccepted] = useState(false);

    const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true);
    const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);

    const playAudio = (ref, url) => {
        try {
            stopAudio(ref);
            ref.current = new Audio(url);
            ref.current.loop = true;
            ref.current.play().catch(err => console.error("Audio play failed:", err));
        } catch (e) {
            console.error("Audio init error:", e);
        }
    };

    const stopAudio = (ref) => {
        if (ref.current) {
            try {
                ref.current.pause();
                ref.current.currentTime = 0;
            } catch (e) {}
            ref.current = null;
        }
    };

    const requestMediaStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.warn("Audio/Video combined media failed, attempting audio-only:", err);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                setLocalStream(stream);
                return stream;
            } catch (err2) {
                console.error("Failed to get media devices:", err2);
                alert("Camera or Microphone access is required for video calls.");
                return null;
            }
        }
    };

    // Caller initiates call — calleeInfo is the full user object of the person being called
    const initiateCall = async (targetUserId, currentUserId, calleeInfo = null) => {
        setCalleeId(targetUserId);
        setCallerId(currentUserId);
        if (calleeInfo) setCallerInfo(calleeInfo); // store callee so caller can navigate
        setCalling(true);
        setIsCallAccepted(false);
        pendingSignalsRef.current = [];

        playAudio(outgoingCallRef, "https://res.cloudinary.com/dr6gycjza/video/upload/v1734374513/duo_ringtone_tehbgk.mp3");

        const stream = await requestMediaStream();
        if (!stream) {
            resetCallState();
            return;
        }

        console.log("🚀 Creating caller SimplePeer (initiator)");
        const peer = new SimplePeer({
            initiator: true,
            trickle: true,
            stream,
            config: { iceServers: ICE_SERVERS }
        });

        peer.on("signal", (data) => {
            console.log("📡 Caller generated signal:", data.type || "candidate");
            emit("signal", { to: targetUserId, data });
        });

        peer.on("stream", (incomingStream) => {
            console.log("📡 Received remote stream on caller:", incomingStream);
            setRemoteStream(incomingStream);
            setIsRemoteCameraOn(true);
        });

        peer.on("error", (err) => console.error("❌ Caller Peer error:", err));

        peerRef.current = peer;
        emit("call-request", { to: targetUserId });
    };

    // Callee accepts call
    const acceptCall = async () => {
        setIncomingCall(false);
        setIsCallAccepted(true);
        stopAudio(incomingCallRef);

        const targetId = callerId || callerInfo?._id;
        const stream = await requestMediaStream();
        if (!stream) {
            resetCallState();
            return;
        }

        console.log("🚀 Creating callee SimplePeer (receiver)");
        const peer = new SimplePeer({
            initiator: false,
            trickle: true,
            stream,
            config: { iceServers: ICE_SERVERS }
        });

        peer.on("signal", (data) => {
            console.log("📡 Callee generated signal:", data.type || "candidate");
            emit("signal", { to: targetId, data });
        });

        peer.on("stream", (incomingStream) => {
            console.log("📡 Received remote stream on callee:", incomingStream);
            setRemoteStream(incomingStream);
            setIsRemoteCameraOn(true);
        });

        peer.on("error", (err) => console.error("❌ Callee Peer error:", err));

        peerRef.current = peer;

        // Process any signals received before peer was instantiated
        if (pendingSignalsRef.current.length > 0) {
            pendingSignalsRef.current.forEach((sig) => {
                try {
                    peer.signal(sig);
                } catch (e) {
                    console.error("Error applying buffered signal:", e);
                }
            });
            pendingSignalsRef.current = [];
        }

        emit("call-accepted", { from: targetId });

        if (callerInfo) {
            navigate(`/chat/call/${callerInfo._id}`, { state: { user: callerInfo } });
        }
    };

    const rejectCall = (userId) => {
        const targetId = calleeId || callerId || callerInfo?._id || userId;
        if (targetId) {
            emit("call-rejected", { from: targetId });
            emit("end-call", { to: targetId });
        }
        resetCallState();
        if (window.location.pathname.includes('/chat/call')) {
            navigate('/chat', { replace: true });
        }
    };

    const endCall = () => {
        const targetId = calleeId || callerId || callerInfo?._id;
        if (targetId) {
            emit("end-call", { to: targetId });
            emit("call-rejected", { from: targetId });
        }
        resetCallState();
        if (window.location.pathname.includes('/chat/call')) {
            navigate('/chat', { replace: true });
        }
    };

    const resetCallState = () => {
        console.log("Resetting WebRTC call state...");
        stopAudio(incomingCallRef);
        stopAudio(outgoingCallRef);

        if (peerRef.current) {
            try {
                peerRef.current.destroy();
            } catch (e) {}
            peerRef.current = null;
        }

        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
            setLocalStream(null);
        }

        if (remoteStream) {
            remoteStream.getTracks().forEach((track) => track.stop());
            setRemoteStream(null);
        }

        setIncomingCall(false);
        setCalling(false);
        setIsCallAccepted(false);
        setCallerInfo(null);
        setCallerId(null);
        setCalleeId(null);
        pendingSignalsRef.current = [];
        setIsRemoteCameraOn(false);
        setIsRemoteMicOn(true);
    };

    useEffect(() => {
        const handleCallRequest = ({ from, signalData }) => {
            console.log("📞 Received call-request from:", from);
            setIncomingCall(true);
            setCallerInfo(from);
            setCallerId(from._id);

            if (signalData) {
                pendingSignalsRef.current.push(signalData);
            }

            playAudio(incomingCallRef, "https://res.cloudinary.com/dr6gycjza/video/upload/v1734374515/google_duo_sj9euw.mp3");
        };

        const handleSignal = ({ data }) => {
            console.log("📡 Received WebRTC signal:", data.type || "candidate");
            if (peerRef.current && !peerRef.current.destroyed) {
                try {
                    peerRef.current.signal(data);
                } catch (e) {
                    console.error("Error signaling peer:", e);
                }
            } else {
                pendingSignalsRef.current.push(data);
            }
        };

        const handleCallAccepted = ({ to }) => {
            console.log("✅ Call accepted by remote user");
            setIsCallAccepted(true);
            setCalling(false);
            stopAudio(outgoingCallRef);
            stopAudio(incomingCallRef);
            const targetId = to || calleeId;
            navigate(`/chat/call/${targetId}`, { state: { user: callerInfo } });
        };

        const handleCallRejected = () => {
            console.log("❌ Call rejected/cancelled by remote user");
            resetCallState();
            if (window.location.pathname.includes('/chat/call')) {
                navigate('/chat', { replace: true });
            }
        };

        const handleCallEnded = () => {
            console.log("❌ Call ended by remote user");
            resetCallState();
            if (window.location.pathname.includes('/chat/call')) {
                navigate('/chat', { replace: true });
            }
        };

        const handleToggleCamera = ({ enabled }) => setIsRemoteCameraOn(enabled);
        const handleToggleMicrophone = ({ enabled }) => setIsRemoteMicOn(enabled);

        on("call-request", handleCallRequest);
        on("signal", handleSignal);
        on("call-accepted", handleCallAccepted);
        on("call-rejected", handleCallRejected);
        on("call-ended", handleCallEnded);
        on("toggleCamera", handleToggleCamera);
        on("toggleMicrophone", handleToggleMicrophone);

        return () => {
            off("call-request", handleCallRequest);
            off("signal", handleSignal);
            off("call-accepted", handleCallAccepted);
            off("call-rejected", handleCallRejected);
            off("call-ended", handleCallEnded);
            off("toggleCamera", handleToggleCamera);
            off("toggleMicrophone", handleToggleMicrophone);
        };
    }, [on, off]);

    return (
        <PeerContext.Provider
            value={{
                localStream,
                remoteStream,
                calling,
                incomingCall,
                callerInfo,
                isCallAccepted,
                initiateCall,
                acceptCall,
                rejectCall,
                endCall,
                resetCallState,
                isRemoteCameraOn,
                isRemoteMicOn,
            }}
        >
            {children}
        </PeerContext.Provider>
    );
};

export const usePeerContext = () => useContext(PeerContext);
