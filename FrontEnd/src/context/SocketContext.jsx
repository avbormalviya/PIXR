// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);

    useEffect(() => {

        if (!socketRef.current) {
            socketRef.current = io("https://pixr-backend.onrender.com", {
                transports: ["websocket"],
                credentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 100000,
            },
        )}

        socketRef.current.on("connect", () => {
            console.log("Connected to socket server");
        });

        socketRef.current.on("connect_error", (error) => {
            console.log("WebSocket connection error:", error);
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log("Disconnected from socket server", reason);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                console.log("Disconnected from socket server");
            }
        };
    }, []);

    const emit = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    const on = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event);
            socketRef.current.on(event, callback);
        }
    };

    const off = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
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
