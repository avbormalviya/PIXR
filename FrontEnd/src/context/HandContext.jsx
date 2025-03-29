import { createContext, useState, useEffect } from "react";

const HandGestureContext = createContext();

export const HandGestureProvider = ({ children }) => {
  const [isHandGesture, setIsHandGesture] = useState(false);
  const [showDisplay, setShowDisplay] = useState(false);

  useEffect(() => {
    setIsHandGesture(localStorage.getItem("handGesture") === "true");
    setShowDisplay(localStorage.getItem("handGestureDisplay") === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("handGesture", isHandGesture);
    localStorage.setItem("handGestureDisplay", showDisplay);
  }, [isHandGesture, showDisplay]);

  return (
    <HandGestureContext.Provider
      value={{ isHandGesture, setIsHandGesture, showDisplay, setShowDisplay }}
    >
      {children}
    </HandGestureContext.Provider>
  );
};

export default HandGestureContext;
