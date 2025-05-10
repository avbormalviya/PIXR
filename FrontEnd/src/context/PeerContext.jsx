    import { createContext, useContext, useEffect, useRef, useState } from "react";
    import SimplePeer from "simple-peer/simplepeer.min.js";
    import { useSocket } from "../context/SocketContext";
    import { useNavigate } from "react-router-dom";

    const PeerContext = createContext();

    export const PeerProvider = ({ children }) => {
        const navigate = useNavigate();
        const { emit, on, off } = useSocket();
        const outgoingCallRef = useRef(null);
        const incomingCallRef = useRef(null);

        // State variables
        const [peer, setPeer] = useState(null);
        const [localStream, setLocalStream] = useState(null);
        const [remoteStream, setRemoteStream] = useState(null);
        const [calling, setCalling] = useState(false);
        const [incomingCall, setIncomingCall] = useState(false);
        const [callerId, setCallerId] = useState(null);
        const [calleeId, setCalleeId] = useState(null);
        const [isCallAccepted, setIsCallAccepted] = useState(false);
        const [initiator, setInitiator] = useState(false);

        const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(false);
        const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);

        // Play and stop audio functions for call notifications
        const playAudio = (ref, url) => {
            ref.current = new Audio(url);
            ref.current.loop = true;
            ref.current.play().catch(err => console.error("Audio play failed:", err));
        };

        const stopAudio = (ref) => {
            if (ref.current) {
                ref.current.pause();
                ref.current.currentTime = 0;
            }
        };

        // Start or end a call
        const initiateCall = (chatUserId, InitUserId) => {
            setCalleeId(chatUserId);
            setCallerId(InitUserId);
            setCalling(true);
            setInitiator(true);
            emit("call-request", { to: chatUserId });
            playAudio(outgoingCallRef, "https://res.cloudinary.com/dr6gycjza/video/upload/v1734374513/duo_ringtone_tehbgk.mp3");
        };

        const acceptCall = () => {
            setIncomingCall(false);
            setIsCallAccepted(true);
            startPeerConnection(callerId);
            emit("call-accepted", { from: callerId });
            stopAudio(incomingCallRef);
        };

        const rejectCall = (userId) => {
            emit("call-rejected", { from: callerId === userId ? calleeId : callerId });
            resetCallState();
        };

        const resetCallState = () => {
            console.log("Resetting call state...");

            // Cleanup peer connection and streams
            peer?.removeAllListeners();
            peer?.destroy();
            setPeer(null);

            localStream?.getTracks().forEach(track => track.stop());
            setLocalStream(null);

            remoteStream?.getTracks().forEach(track => track.stop());
            setRemoteStream(null);

            // Reset UI state
            setIncomingCall(false);
            setCalling(false);
            setIsCallAccepted(false);
            stopAudio(incomingCallRef);
            stopAudio(outgoingCallRef);

            setIsRemoteCameraOn(false);
            setIsRemoteMicOn(false);

            navigate("/");
        };

        const startPeerConnection = async (user) => {
            try {
                const stream = await requestPermissions();
                if (!stream) return;

                console.log("🎥 Local stream ready:", stream);
                setLocalStream(stream);

                const newPeer = new SimplePeer({
                    initiator,
                    trickle: true, // Enable trickle ICE instead of waiting for full SDP
                    stream,
                    config: {
                    iceServers: [
                            { urls: "stun:stun.l.google.com:19302" },
                            {
                                urls:   "turn:numb.viagenie.ca:3478",
                                username:"webrtc@live.com",
                                credential:"muazkh"
                            }
                        ]
                    }
                });

                newPeer.on("iceStateChange", (state) => {
                    console.log("🧊 ICE state changed:", state);
                });

                newPeer.on("iceConnectionStateChange", () => {
                    console.log("🧊 ICE connection state:", newPeer._pc.iceConnectionState);
                });

                newPeer.on("connect", () => {
                    console.log("✅ Peer connected!");
                });


                newPeer.on("signal", (data) => {
                    console.log("📡 Sending signal:", data);
                    emit("signal", { to: user, data });
                });

                newPeer.on("stream", (incomingStream) => {
                    console.log("📡 Received remote stream:", incomingStream);
                    setRemoteStream(incomingStream);
                });

                newPeer.on("error", (err) => console.error("❌ Peer error:", err));

                setPeer(newPeer);
            } catch (error) {
                console.error("❌ Error starting peer connection:", error);
                resetCallState();
            }
        };


        const requestPermissions = async () => {
            const constraints = {};

            if (navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const hasVideo = devices.some(device => device.kind === "videoinput");
                const hasAudio = devices.some(device => device.kind === "audioinput");

                if (hasVideo) constraints.video = true;
                if (hasAudio) constraints.audio = true;
            }

            if (!constraints.video && !constraints.audio) {
                console.error("No media devices available");
                alert("No camera or microphone detected. Please connect a device and try again.");
                return null;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("Media stream acquired:", stream);
                return stream;
            } catch (error) {
                console.error("Error getting user media:", error);
                return null;
            }

        };

        useEffect(() => {
            const handleCallRequest = ({ from }) => {
                setIncomingCall(true);
                setCallerId(from._id);
                navigate(`/chat/call/${from._id}`, { state: { user: from } });
                playAudio(incomingCallRef, "https://res.cloudinary.com/dr6gycjza/video/upload/v1734374515/google_duo_sj9euw.mp3");
            };

            const handleSignal = ({ data }) => {
                console.log("📡 Received signal data:", data);
                if (!peer || peer.destroyed) {
                    console.error("❌ Peer is null or destroyed");
                    return;
                }
                try {
                    peer.signal(data);
                } catch (error) {
                    console.error("❌ Error handling signal:", error);
                }
            };

            const handleCallAccepted = () => {
                setInitiator(false);
                setIsCallAccepted(true);
                startPeerConnection(calleeId);
                setCalling(false);
                stopAudio(incomingCallRef);
                stopAudio(outgoingCallRef);
            };

            const handleCallRejected = () => {
                resetCallState();
            };

            on("call-request", handleCallRequest);
            on("signal", handleSignal);
            on("call-accepted", handleCallAccepted);
            on("call-rejected", handleCallRejected);
            on("toggleCamera", ({ enabled }) => setIsRemoteCameraOn(enabled));

            return () => {
                off("call-request", handleCallRequest);
                off("signal", handleSignal);
                off("call-accepted", handleCallAccepted);
                off("call-rejected", handleCallRejected);
                peer?.destroy();
                localStream?.getTracks().forEach((track) => track.stop());
            };
        }, [peer, on, off, navigate, callerId, calleeId, localStream]);

        return (
            <PeerContext.Provider
                value={{
                    localStream,
                    remoteStream,
                    calling,
                    incomingCall,
                    isCallAccepted,
                    initiateCall,
                    acceptCall,
                    rejectCall,
                    isRemoteCameraOn,
                    isRemoteMicOn,
                }}
            >
                {children}
            </PeerContext.Provider>
        );
    };

    export const usePeerContext = () => useContext(PeerContext);
