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
        isRemoteCameraOn,
        isRemoteMicOn
    } = usePeerContext();

    const [isLocalCameraOn, setIsLocalCameraOn] = useState(false);
    const [isLocalMicOn, setIsLocalMicOn] = useState(true);
    const [chatUser, setChatUser] = useState({});

    // Set chat user from location state
    useEffect(() => {
        if (location.state?.user) {
            setChatUser(location.state.user);
        } else {
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    useEffect(() => {
        console.log("localStream", localStream);
        console.log("remoteStream", remoteStream);
        console.log("localVideoRef", localVideoRef);
        if (localVideoRef.current && localStream) {
            console.log("localStream", localStream);
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);
    

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    

    const toggleCamera = () => {
        const videoTrack = localStream?.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsLocalCameraOn(videoTrack.enabled);
            emit("toggleCamera", { to: chatUser?._id, enabled: videoTrack.enabled });
        }
    };
    
    const toggleMicrophone = () => {
        const audioTrack = localStream?.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsLocalMicOn(audioTrack.enabled);
        }
    };
    

    return (
        <section className={style.video_call}>
            <div className={style.remote_video_wrapper}>
                <video className={style.remote_video} ref={remoteVideoRef} autoPlay playsInline />

                {!isRemoteCameraOn && (
                    <div className={style.remote_video_overlay}>
                        <Img url={chatUser.profilePic} alt="" />
                        <h1>{chatUser.userName}</h1>
                    </div>
                )}

            </div>

            {!calling && !incomingCall && (
                <div className={style.local_video_wrapper}>
                    <div className={style.local_video_holder}>
                        <video className={style.local_video} ref={localVideoRef} autoPlay playsInline muted />

                        {!isLocalCameraOn && (
                            <div className={style.local_video_overlay}>
                                <Img url={user.profilePic} alt="" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={style.controls_bar}>
                {incomingCall && (
                    <i className="material-symbols-rounded" onClick={acceptCall}>call</i>
                )}

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

                <i className="material-symbols-rounded" onClick={() => rejectCall(user._id)}>call_end</i>
            </div>
        </section>
    );
};
