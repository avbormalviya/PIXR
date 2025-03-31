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
        navigate("/");

        stopAudio(incomingCallRef);
        stopAudio(outgoingCallRef);

        setIsRemoteCameraOn(false);
        setIsRemoteMicOn(false);
    };

    const startPeerConnection = async (user) => {
        try {
            const stream = await requestPermissions();
            if (!stream) return;
            setLocalStream(stream);

            if (peer) {
                console.log("Destroying old peer before creating a new one.");
                peer.destroy();
            }

            const newPeer = new SimplePeer({
                initiator,
                trickle: false,
                stream,
            });

            newPeer.on("signal", (data) => {
                console.log("Sending signal:", data);
                emit("signal", { to: user, data });
            });

            newPeer.on("stream", (incomingStream) => {
                console.log("Received remote stream:", incomingStream);
                setRemoteStream(incomingStream);
            });

            newPeer.on("error", (err) => console.error("Peer error:", err));

            setPeer(newPeer);
        } catch (error) {
            console.error("Error starting peer connection:", error);
            resetCallState();
        }
    };



    const requestPermissions = async () => {
        const micPermission = await navigator.permissions.query({ name: "microphone" });
        const camPermission = await navigator.permissions.query({ name: "camera" });

        if (micPermission.state === "denied" || camPermission.state === "denied") {
            alert("Microphone and Camera access is required for video calls. Please enable them in your browser settings.");
            return false;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            return stream; // Return the stream if access is granted
        } catch (error) {
            alert("You need to allow microphone and camera access to use this feature.");
            console.error("Permission error:", error);
            return false;
        }
    };

    useEffect(() => {
        navigator.permissions.query({ name: "microphone" }).then((micPerm) => {
            micPerm.onchange = () => {
                console.log("Microphone permission changed:", micPerm.state);
                if (micPerm.state === "granted") {
                    alert("Microphone access granted! You can now start a call.");
                }
            };
        });

        navigator.permissions.query({ name: "camera" }).then((camPerm) => {
            camPerm.onchange = () => {
                console.log("Camera permission changed:", camPerm.state);
                if (camPerm.state === "granted") {
                    alert("Camera access granted! You can now start a call.");
                }
            };
        });
    }, []);


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
                console.log("Received signaling data:", data);

                if (data.type === "answer") {
                    if (peer._pc.signalingState === "stable") {
                        console.warn("Ignoring duplicate answer, already in stable state.");
                        return;
                    }
                }

                console.log("Processing signal:", data);
                peer.signal(data);
            } catch (error) {
                console.error("Error handling signal:", error);
            }
        };


        const handleCallAccepted = () => {
            setIsCallAccepted(true);
            console.log("Call accepted, starting peer connection...");

            startPeerConnection(calleeId); // Start connection for the receiver too
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
