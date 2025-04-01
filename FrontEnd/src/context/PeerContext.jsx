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
            // Request new media stream
            const stream = await requestPermissions();
            if (!stream) return;

            setLocalStream(stream);

            // Create a new peer connection
            const newPeer = new SimplePeer({
                initiator,
                trickle: false,
                stream,
            });

            // Handle signal data for signaling process
            newPeer.on("signal", (data) => {
                console.log("Sending signal:", data);
                emit("signal", { to: user, data });
            });

            // Handle incoming remote stream
            newPeer.on("stream", (incomingStream) => {
                console.log("Received remote stream:", incomingStream);
                setRemoteStream(incomingStream);
            });

            // Error handling
            newPeer.on("error", (err) => console.error("Peer error:", err));

            setPeer(newPeer);
        } catch (error) {
            console.error("Error starting peer connection:", error);
            resetCallState();
        }
    };

    const requestPermissions = async () => {
        try {
            // Request initial media stream to detect devices
            const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            initialStream.getTracks().forEach(track => track.stop()); // Stop the initial stream

            // Get available devices (audio/video)
            const devices = await navigator.mediaDevices.enumerateDevices();
            console.log("Available devices:", devices);

            const videoDevices = devices.filter(device => device.kind === "videoinput");
            const audioDevices = devices.filter(device => device.kind === "audioinput");

            // Select the first available video and audio devices
            const preferredCameraId = videoDevices.length > 0 ? videoDevices[0].deviceId : null;
            const preferredMicId = audioDevices.length > 0 ? audioDevices[0].deviceId : null;

            // Request media stream with selected devices
            const stream = await navigator.mediaDevices.getUserMedia({
                video: preferredCameraId ? { deviceId: { exact: preferredCameraId } } : true,
                audio: preferredMicId ? { deviceId: { exact: preferredMicId } } : true,
            });

            console.log("Access granted:", stream);
            return stream;
        } catch (error) {
            console.error("Permission error:", error);
            alert("You need to allow microphone and camera access to use this feature.");
            return false;
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
            if (!peer || peer.destroyed) return;

            try {
                peer.signal(data);
            } catch (error) {
                console.error("Error handling signal:", error);
            }
        };

        const handleCallAccepted = () => {
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
