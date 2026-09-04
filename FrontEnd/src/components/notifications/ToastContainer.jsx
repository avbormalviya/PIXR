import React, { useState, useEffect } from "react";
import style from "./toastContainer.module.scss";
import { useSocket } from "../../context/SocketContext";
import { Img } from "../img/Img";
import { useNavigate } from "react-router-dom";
import { toastBus } from "../../utils/toast";

export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);
    const { on, off } = useSocket();
    const navigate = useNavigate();

    const addToast = (toast) => {
        const id = Date.now() + Math.random();
        const newToast = { id, type: "info", duration: 4500, ...toast };
        setToasts((prev) => [newToast, ...prev].slice(0, 5));

        // Play sound — skip for error toasts (too jarring)
        if (newToast.type !== "error") {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                }
            } catch (e) {}
        }

        setTimeout(() => removeToast(id), newToast.duration);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Subscribe to global toast bus (for programmatic toasts from anywhere)
    useEffect(() => {
        const unsub = toastBus.subscribe(addToast);
        return unsub;
    }, []);

    // Socket-based notifications
    useEffect(() => {
        const handleNewMessage = (message) => {
            if (!message) return;
            addToast({
                type: "info",
                title: message.sender?.userName || message.sender?.fullName || "New Message",
                body: message.content || (message.attachments ? "Sent an attachment" : "New message"),
                avatar: message.sender?.profilePic,
                link: `/chat`,
            });
        };

        const handleNotification = (notif) => {
            if (!notif) return;
            addToast({
                type: "info",
                title: notif.sender?.userName || "New Notification",
                body: notif.message || "Interacted with your profile/post",
                avatar: notif.sender?.profilePic,
                link: `/notifications`,
            });
        };

        on("receiveMessage", handleNewMessage);
        on("notification", handleNotification);

        return () => {
            off("receiveMessage", handleNewMessage);
            off("notification", handleNotification);
        };
    }, [on, off]);

    if (toasts.length === 0) return null;

    const getTypeIcon = (type) => {
        if (type === "error") return "error";
        if (type === "success") return "check_circle";
        return "info";
    };

    return (
        <div className={style.toast_container}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`${style.toast_card} ${style[`toast_${toast.type}`]}`}
                    onClick={() => {
                        if (toast.link) navigate(toast.link);
                        removeToast(toast.id);
                    }}
                >
                    {toast.avatar ? (
                        <Img url={toast.avatar} className={style.toast_avatar} alt="" />
                    ) : (
                        <i className={`material-symbols-rounded ${style.toast_type_icon}`}>
                            {getTypeIcon(toast.type)}
                        </i>
                    )}
                    <div className={style.toast_content}>
                        <h5 className={style.toast_title}>{toast.title}</h5>
                        <p className={style.toast_body}>{toast.body}</p>
                    </div>
                    <button
                        className={style.toast_close}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeToast(toast.id);
                        }}
                    >
                        <i className="material-symbols-rounded">close</i>
                    </button>
                </div>
            ))}
        </div>
    );
};
