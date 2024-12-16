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
        emit("call-rejected", { from: callerId == userId ? calleeId : callerId });
        resetCallState();
    };

    const resetCallState = () => {
        setIncomingCall(false);
        setCalling(false);
        setIsCallAccepted(false);
        navigate(-1);

        stopAudio(incomingCallRef);
        stopAudio(outgoingCallRef);
    };

    const startPeerConnection = async (user) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);

            const newPeer = new SimplePeer({
                initiator,
                trickle: false,
                stream,
            });

            newPeer.on("signal", (data) => emit("signal", { to: user, data }));
            newPeer.on("stream", (incomingStream) => setRemoteStream(incomingStream));

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
        };

        const handleSignal = ({ data }) => {
            if (peer) peer.signal(data);
        };

        const handleCallAccepted = () => {
            setIsCallAccepted(true);
            startPeerConnection(calleeId);
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
