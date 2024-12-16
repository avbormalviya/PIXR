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
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;

            localVideoRef.current.onloadedmetadata = () => {
                localVideoRef.current.play().catch((error) => {
                    console.error("Failed to play video:", error);
                });
            };
        }
    }, [localStream]);
    
    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;

            remoteVideoRef.current.onloadedmetadata = () => {
                remoteVideoRef.current.play().catch((error) => {
                    console.error("Failed to play video:", error);
                });
            };
        }
    }, [remoteStream]);
    

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
                        <video className={style.local_video} ref={localVideoRef} autoPlay playsInline />

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
