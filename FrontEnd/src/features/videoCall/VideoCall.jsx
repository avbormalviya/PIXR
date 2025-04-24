import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useLocation, useNavigate } from "react-router-dom";
import style from "./videoCall.module.scss";
import { usePeerContext } from '../../context/PeerContext';
import { Img } from "../../components/img/Img";
import { useSelector } from "react-redux";
import { requestCameraAndMicAccess } from "../../utils/getPermission";
import CameraswitchRoundedIcon from '@mui/icons-material/CameraswitchRounded';

export const VideoCall = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { emit } = useSocket();
    const user = useSelector(state => state.user.user);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const {
        peer,
        localStream,
        setLocalStream,
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
    const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);


    useEffect(() => {
        ( async () => {
            const result = await requestCameraAndMicAccess();
            setIsPermissionsGranted(result);
        })();
    }, []);

    useEffect(() => {
        if (location.state?.user && !chatUser?._id) {
            setChatUser(location.state.user);
        } else if (!location.state?.user && chatUser?._id) {
            navigate("/", { replace: true });
        }
    }, [location.state?.user, chatUser?._id, navigate]);

    useEffect(() => {
        if (localStream) {
            console.log("Local stream available:", localStream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            console.log("✅ Setting remote video stream", remoteStream);
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(err => console.error("❌ Remote video play error:", err));
        }
    }, [remoteStream]);

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

    const switchCamera = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length < 2) {
            console.warn("Only one video device found.");
            return;
        }

        const currentTrack = localStream?.getVideoTracks()[0];
        const currentDeviceId = currentTrack?.getSettings().deviceId;
        const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
        const nextIndex = (currentIndex + 1) % videoDevices.length;
        const nextDeviceId = videoDevices[nextIndex].deviceId;

        // Stop existing tracks
        localStream?.getTracks().forEach(track => track.stop());

        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: nextDeviceId } },
                audio: true,
            });

            // Update state with the new stream
            setLocalStream(newStream);

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = newStream;
            }

            // If you're using SimplePeer, you may need to replace the stream in the peer connection too
            peer?.replaceTrack(currentTrack, newStream.getVideoTracks()[0], localStream);
        } catch (err) {
            console.error("Error switching camera:", err);
        }
    };


    const toggleMicrophone = () => {
        if (!localStream) return;

        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsLocalMicOn(audioTrack.enabled);
        }
    };

    const onCallEnd = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        setIsLocalCameraOn(false);
        setIsLocalMicOn(true);
        setChatUser({});

        rejectCall(user._id);

        navigate("/");
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
                {incomingCall && <i className="material-symbols-rounded" onClick={acceptCall}>call</i>}
                {isCallAccepted && (
                    <>
                        <i className="material-symbols-rounded" onClick={toggleCamera} disabled={!isPermissionsGranted?.camera?.granted}>
                            {isLocalCameraOn ? 'videocam' : 'videocam_off'}
                        </i>
                        <i className="material-symbols-rounded" onClick={toggleMicrophone} disabled={!isPermissionsGranted?.mic?.granted}>
                            {isLocalMicOn ? 'mic' : 'mic_off'}
                        </i>
                    </>
                )}
                <i className="material-symbols-rounded" onClick={onCallEnd}>call_end</i>
            </div>
        </section>
    );
};
