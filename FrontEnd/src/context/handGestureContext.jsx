import { createContext, useContext, useEffect, useState } from "react";

const HandGestureContext = createContext();

export const HandGestureProvider = ({ children }) => {
    const [isHandGesture, setIsHandGesture] = useState(() => {
        return localStorage.getItem("handGesture") === "true";
    });
    const [showDisplay, setShowDisplay] = useState(() => {
        return localStorage.getItem("handGestureDisplay") === "true";
    });

    useEffect(() => {
        const handleStorageChange = () => {
            setIsHandGesture(localStorage.getItem("handGesture") === "true");
            setShowDisplay(localStorage.getItem("handGestureDisplay") === "true");
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const toggleHandGesture = () => {
        setIsHandGesture((prev) => {
            const newValue = !prev;
            localStorage.setItem("handGesture", newValue);
            return newValue;
        });
    };

    const toggleShowDisplay = () => {
        setShowDisplay((prev) => {
            const newValue = !prev;
            localStorage.setItem("handGestureDisplay", newValue);
            return newValue;
        });
    };

    return (
        <HandGestureContext.Provider value={{ isHandGesture, showDisplay, toggleHandGesture, toggleShowDisplay }}>
            {children}
        </HandGestureContext.Provider>
    );
};

export const useHandGesture = () => useContext(HandGestureContext);
