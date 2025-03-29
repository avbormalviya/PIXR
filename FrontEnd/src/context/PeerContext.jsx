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

    const playAudio = (ref, url) => {
        ref.current = new Audio(url);
        ref.current.loop = true;
        ref.current?.play().catch(error => console.error("Failed to play audio:", error));
    };

    const stopAudio = (ref) => {
        if (ref.current) {
            ref.current.pause();
            ref.current.currentTime = 0;
        }
    };

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
        setCallerId(null);
        setCalleeId(null);
        resetCallState();
    };


    const resetCallState = () => {
        setIncomingCall(false);
        setCalling(false);
        setIsCallAccepted(false);
        setIsRemoteCameraOn(false);
        setIsRemoteMicOn(false);
        navigate(-1);

        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }

        // Stop remote stream
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }

        // Destroy peer connection
        if (peer) {
            peer.destroy();
            setPeer(null);
        }

        stopAudio(incomingCallRef);
        stopAudio(outgoingCallRef);
    };

    const checkPermissions = async () => {
        const permissions = await navigator.permissions.query({ name: "camera" });
        console.log("Camera permission status:", permissions.state);

        if (permissions.state === "denied") {
            throw new Error("Camera access denied by user");
        }
    };


    const pendingSignals = useRef([]);


    const handleSignal = ({ data }) => {
        if (!peer) {
            console.warn("Peer not initialized yet, storing signal...");
            pendingSignals.current.push(data);  // ✅ Now it will work
            return;
        }

        if (peer.signalingState === "stable" || peer.signalingState === "have-local-offer") {
            console.log("Applying received signal:", data);
            peer.signal(data);
        } else {
            console.warn("Received signal at invalid state:", peer.signalingState);
        }
    };



    useEffect(() => {
        if (peer && pendingSignals.current.length > 0) {
            console.log("Processing queued signals...");
            while (pendingSignals.current.length > 0) {
                const signal = pendingSignals.current.shift();
                peer.signal(signal);
            }
        }
    }, [peer]);



    const getAvailableDevices = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log("Available devices:", devices);

        const videoDevices = devices.filter(device => device.kind === "videoinput");
        const audioDevices = devices.filter(device => device.kind === "audioinput");

        if (videoDevices.length === 0) console.warn("No camera found!");
        if (audioDevices.length === 0) console.warn("No microphone found!");

        return {
            videoId: videoDevices.length > 0 ? videoDevices[0].deviceId : null,
            audioId: audioDevices.length > 0 ? audioDevices[0].deviceId : null
        };
    };


    const startPeerConnection = async (user) => {
        try {
            const { videoId, audioId } = await getAvailableDevices();

            if (!videoId && !audioId) throw new Error("No media devices available");

            const constraints = {
                video: videoId ? { deviceId: { exact: videoId } } : false,
                audio: audioId ? { deviceId: { exact: audioId } } : false
            };

            console.log("Requesting media with constraints:", constraints);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);

            const iceServers = [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" },
                {
                    urls: "turn:relay.backups.cz",
                    username: "webrtc",
                    credential: "webrtc"
                },
                {
                    urls: "turn:turn.anyfirewall.com:443?transport=tcp",
                    credential: "webrtc",
                    username: "webrtc"
                }
            ];

            const newPeer = new SimplePeer({
                initiator,
                trickle: false,
                stream,
                config: { iceServers }
            });


            newPeer.on("signal", (data) => emit("signal", { to: user, data }));
            newPeer.on("stream", (incomingStream) => {
                console.log("Received remote stream:", incomingStream);
                setRemoteStream(incomingStream);
            });
            newPeer.on("error", (err) => console.error("Peer connection error:", err));
            newPeer.on("close", () => console.log("Peer connection closed"));

            setPeer(newPeer);

        } catch (error) {
            console.error("Error starting peer connection:", error);
            resetCallState();
        }
    };




    useEffect(() => {
        const handleCallRequest = ({ from }) => {
            setIncomingCall(true);
            setCallerId(from._id);
            navigate(`/chat/call/${from._id}`, { state: { user: from } });
            playAudio(incomingCallRef, "https://res.cloudinary.com/dr6gycjza/video/upload/v1734374515/google_duo_sj9euw.mp3");
            setIsRemoteCameraOn(false);
            setIsRemoteMicOn(false);
        };

        const handleSignal = ({ data }) => {
            peer?.signal(data);
        };

        const handleCallAccepted = () => {
            if (!peer) {
                console.log("Starting peer connection on call accepted...");
                startPeerConnection(calleeId);
            } else {
                console.log("Call already accepted, peer exists.");
            }

            setIsCallAccepted(true);
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
    }, [peer, callerId, calleeId, localStream]);  // Remove `on`, `off`, and `navigate` if unnecessary


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
