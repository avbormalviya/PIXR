// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection only once
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:4000", {
                credentials: true,
                transports: ["websocket"],
            });
        }

        // Log connection status
        socketRef.current.on("connect", () => {
            console.log("Connected to socket server");
        });

        socketRef.current.on("disconnect", (reason) => {
            console.log("Disconnected from socket server", reason);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null; // Prevents memory leaks
                console.log("Disconnected from socket server");
            }
        };
    }, []);

    // Function to emit events to the server
    const emit = (event, data) => {
        if (socketRef.current) {
            socketRef.current.emit(event, data);
        }
    };

    // Function to listen for events from the server
    const on = (event, callback) => {
        if (socketRef.current) {
            socketRef.current.off(event); // Clean up previous listener
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
