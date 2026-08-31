import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    // Stores event -> Set of callbacks so listeners persist across socket reconnects
    const eventListenersRef = useRef(new Map());
    const { user } = useSelector((state) => state.user || {});

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");

        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const socket = io(import.meta.env.VITE_BACKEND_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            auth: {
                token: accessToken
            },
            extraHeaders: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
        });

        socketRef.current = socket;

        // Re-attach all registered listeners to the new socket instance
        eventListenersRef.current.forEach((callbacks, event) => {
            callbacks.forEach((cb) => {
                socket.on(event, cb);
            });
        });

        socket.on("connect", () => {
            console.log("🟢 Connected to socket server as:", user?.userName || "guest", socket.id);
        });

        socket.on("connect_error", (error) => {
            console.log("🔴 WebSocket connection error:", error);
        });

        socket.on("disconnect", (reason) => {
            console.log("🟡 Disconnected from socket server:", reason);
        });

        return () => {
            if (socketRef.current === socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, [user?._id]);

    const emit = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    const on = (event, callback) => {
        if (!eventListenersRef.current.has(event)) {
            eventListenersRef.current.set(event, new Set());
        }
        eventListenersRef.current.get(event).add(callback);

        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    const off = (event, callback) => {
        if (eventListenersRef.current.has(event)) {
            if (callback) {
                eventListenersRef.current.get(event).delete(callback);
            } else {
                eventListenersRef.current.delete(event);
            }
        }

        if (socketRef.current) {
            if (callback) {
                socketRef.current.off(event, callback);
            } else {
                socketRef.current.off(event);
            }
        }
    };

    return (
        <SocketContext.Provider value={{ emit, on, off }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};

