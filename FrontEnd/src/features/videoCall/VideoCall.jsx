import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import style from "./videoCall.module.scss";
import { usePeerContext } from '../../context/PeerContext';
import { Img } from "../../components/img/Img";
import { useSelector } from "react-redux";

export const VideoCall = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { emit } = useSocket();
    const user = useSelector(state => state.user.user);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const {
        localStream,
        remoteStream,
        calling,
        incomingCall,
        isCallAccepted,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        isRemoteCameraOn,
        isRemoteMicOn
    } = usePeerContext();

    const [isLocalCameraOn, setIsLocalCameraOn] = useState(true);
    const [isLocalMicOn, setIsLocalMicOn] = useState(true);
    const [chatUser, setChatUser] = useState({});

    useEffect(() => {
        if (location.state?.user && !chatUser?._id) {
            setChatUser(location.state.user);
        } else if (!location.state?.user && !chatUser?._id) {
            navigate("/chat", { replace: true });
        }
    }, [location.state?.user, chatUser?._id, navigate]);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log("✅ Setting local video stream to element", localStream);
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(err => console.error("❌ Local video play error:", err));

            const vTrack = localStream.getVideoTracks()[0];
            if (vTrack) {
                setIsLocalCameraOn(vTrack.enabled);
            }
        }
    }, [localStream, localVideoRef.current, isCallAccepted, calling]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log("✅ Setting remote video stream to element", remoteStream);
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => console.error("❌ Remote video play error:", err));
        }
    }, [remoteStream, remoteVideoRef.current, isCallAccepted]);

    const toggleCamera = () => {
        if (!localStream) return;

        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsLocalCameraOn(videoTrack.enabled);
            if (chatUser?._id) {
                emit("toggleCamera", { to: chatUser._id, enabled: videoTrack.enabled });
            }
        }
    };

    const toggleMicrophone = () => {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsLocalMicOn(audioTrack.enabled);
            if (chatUser?._id) {
                emit("toggleMicrophone", { to: chatUser._id, enabled: audioTrack.enabled });
            }
        }
    };

    const onCallEnd = () => {
        endCall();
        navigate("/chat", { replace: true });
    };

    return (
        <section className={style.video_call}>
            <div className={style.remote_video_wrapper}>
                <video className={style.remote_video} ref={remoteVideoRef} autoPlay playsInline />
                {(!isRemoteCameraOn || !remoteStream) && (
                    <div className={style.remote_video_overlay}>
                        <Img url={chatUser?.profilePic} alt="" />
                        <h1>{calling ? `Calling ${chatUser?.fullName || chatUser?.userName || ""}...` : (chatUser?.fullName || chatUser?.userName || "Video Call")}</h1>
                    </div>
                )}
            </div>

            {localStream && (
                <div className={style.local_video_wrapper}>
                    <div className={style.local_video_holder}>
                        <video className={style.local_video} ref={localVideoRef} autoPlay playsInline muted />
                        {!isLocalCameraOn && (
                            <div className={style.local_video_overlay}>
                                <Img url={user?.profilePic} alt="" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={style.controls_bar}>
                {incomingCall && <i className="material-symbols-rounded" onClick={acceptCall}>call</i>}
                {isCallAccepted && (
                    <>
                        <i className="material-symbols-rounded" onClick={toggleCamera}>
                            {isLocalCameraOn ? 'videocam' : 'videocam_off'}
                        </i>
                        <i className="material-symbols-rounded" onClick={toggleMicrophone}>
                            {isLocalMicOn ? 'mic' : 'mic_off'}
                        </i>
                    </>
                )}
                <i className="material-symbols-rounded" onClick={onCallEnd}>call_end</i>
            </div>
        </section>
    );
};
