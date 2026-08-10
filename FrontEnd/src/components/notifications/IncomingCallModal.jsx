import React from "react";
import style from "./incomingCallModal.module.scss";
import { usePeerContext } from "../../context/PeerContext";
import { Img } from "../img/Img";

export const IncomingCallModal = () => {
    const { incomingCall, callerInfo, acceptCall, rejectCall } = usePeerContext();

    if (!incomingCall || !callerInfo) return null;

    return (
        <div className={style.incoming_call_overlay}>
            <div className={style.caller_info}>
                <div className={style.avatar_wrapper}>
                    <Img url={callerInfo.profilePic} alt={callerInfo.userName || "Caller"} />
                    <div className={style.pulse_ring} />
                </div>
                <div className={style.caller_details}>
                    <h4>{callerInfo.fullName || callerInfo.userName || "Incoming Call"}</h4>
                    <p>
                        <i className="material-symbols-rounded">videocam</i>
                        Incoming Video Call...
                    </p>
                </div>
            </div>

            <div className={style.action_buttons}>
                <button
                    type="button"
                    className={style.decline_btn}
                    onClick={() => rejectCall(callerInfo._id)}
                    title="Decline Call"
                >
                    <i className="material-symbols-rounded">call_end</i>
                </button>

                <button
                    type="button"
                    className={style.accept_btn}
                    onClick={acceptCall}
                    title="Accept Call"
                >
                    <i className="material-symbols-rounded">call</i>
                </button>
            </div>
        </div>
    );
};
