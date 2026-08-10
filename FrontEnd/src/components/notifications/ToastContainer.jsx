import React, { useState, useEffect } from "react";
import style from "./toastContainer.module.scss";
import { useSocket } from "../../context/SocketContext";
import { Img } from "../img/Img";
import { useNavigate } from "react-router-dom";

export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);
    const { on, off } = useSocket();
    const navigate = useNavigate();

    const addToast = (toast) => {
        const id = Date.now() + Math.random();
        const newToast = { id, ...toast };
        setToasts((prev) => [newToast, ...prev].slice(0, 4));

        // Play subtle notification audio
        try {
            const audio = new Audio("https://res.cloudinary.com/dr6gycjza/video/upload/v1734374513/duo_ringtone_tehbgk.mp3");
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}

        // Auto remove toast after 4.5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4500);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        const handleNewMessage = (message) => {
            if (!message) return;
            addToast({
                title: message.sender?.userName || message.sender?.fullName || "New Message",
                body: message.content || (message.attachments ? "Sent an attachment" : "New message"),
                avatar: message.sender?.profilePic,
                link: `/chat`
            });
        };

        const handleNotification = (notif) => {
            if (!notif) return;
            addToast({
                title: notif.sender?.userName || "New Notification",
                body: notif.message || "Interacted with your profile/post",
                avatar: notif.sender?.profilePic,
                link: `/notifications`
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

    return (
        <div className={style.toast_container}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={style.toast_card}
                    onClick={() => {
                        if (toast.link) navigate(toast.link);
                        removeToast(toast.id);
                    }}
                >
                    <Img url={toast.avatar} className={style.toast_avatar} alt="" />
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
