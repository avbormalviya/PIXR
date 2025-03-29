import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const HandMouseControl = ({ showDisplay }) => {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const [deviceId, setDeviceId] = useState(null);

  let cursorX = window.innerWidth / 2, cursorY = window.innerHeight / 2;
  let prevX = cursorX, prevY = cursorY;
  const lastScrollY = useRef(null);
  const isClickingAllowed = useRef(true);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setDeviceId(videoDevices[0]?.deviceId);
    });
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@latest/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
      modelComplexity: 1,
    });

    handsRef.current = hands; // Store hands instance

    hands.onResults((results) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return;

      const landmarks = results.multiHandLandmarks[0];
      const indexFingerTip = landmarks[8]; // Index finger tip
      const thumbTip = landmarks[4]; // Thumb tip
      const middleTip = landmarks[12]; // Middle finger tip
      const middleMCP = landmarks[9]; // Middle finger base joint

      // Calculate distance between thumb & index finger
      const pinchDistance = Math.sqrt(
        Math.pow(indexFingerTip.x - thumbTip.x, 2) +
        Math.pow(indexFingerTip.y - thumbTip.y, 2)
      );

      // Define pinch threshold (adjust if needed)
      const PINCH_THRESHOLD = 0.02;
      const isPinching = pinchDistance < PINCH_THRESHOLD;

      let handX = window.innerWidth - indexFingerTip.x * window.innerWidth;
      let handY = indexFingerTip.y * window.innerHeight;
      moveCursor(handX, handY);

      // **Pinch Click Detection**
      if (pinchDistance < 0.05 && isClickingAllowed.current) {
        console.log("Click detected!");
        simulateClick();
      }

      console.log("✅ Hand detected!", landmarks);
      detectScrollGesture(landmarks);
    });


    let isMounted = true;

    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (isMounted && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        camera.start();
      })
      .catch((error) => console.error("Camera selection error:", error));

    return () => {
      isMounted = false;
      handsRef.current?.close();
    };
  }, [deviceId]);

  const moveCursor = (x, y) => {
    const smoothingFactor = 0.2;
    cursorX = prevX + (x - prevX) * smoothingFactor;
    cursorY = prevY + (y - prevY) * smoothingFactor;
    prevX = cursorX;
    prevY = cursorY;

    let cursor = document.getElementById("customCursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = "customCursor";
      cursor.style.position = "absolute";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "10000";

      const verticalLine = document.createElement("div");
      verticalLine.style.position = "absolute";
      verticalLine.style.width = "2px";
      verticalLine.style.height = "20px";
      verticalLine.style.background = "var(--primary-color)";
      verticalLine.style.left = "50%";
      verticalLine.style.top = "50%";
      verticalLine.style.transform = "translate(-50%, -50%)";
      cursor.appendChild(verticalLine);

      const horizontalLine = document.createElement("div");
      horizontalLine.style.position = "absolute";
      horizontalLine.style.width = "20px";
      horizontalLine.style.height = "2px";
      horizontalLine.style.background = "var(--primary-color)";
      horizontalLine.style.left = "50%";
      horizontalLine.style.top = "50%";
      horizontalLine.style.transform = "translate(-50%, -50%)";
      cursor.appendChild(horizontalLine);

      document.body.appendChild(cursor);
    }

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
  };

  useEffect(() => {
    const handleMouseMove = (e) => moveCursor(e.clientX, e.clientY);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
        document.removeEventListener("mousemove", handleMouseMove);

        // Cleanup: Remove cursor when component unmounts
        const cursor = document.getElementById("customCursor");
        if (cursor) {
            cursor.remove();
        }
    };
}, []);

const clickSound = new Audio("https://res.cloudinary.com/dr6gycjza/video/upload/v1743244799/WhatsApp_Audio_2025-03-29_at_16.05.44_bedba3c6_drhc7w.mp3"); // Replace with your actual sound URL

const simulateClick = () => {
    if (!isClickingAllowed.current) return;

    const element = document.elementFromPoint(cursorX, cursorY);
    if (!element) return;

    // Play click sound
    clickSound.currentTime = 0; // Reset audio if it's already playing
    clickSound.play().catch(error => console.error("Click sound failed:", error));

    const mouseEvent = new MouseEvent("click", {
      clientX: cursorX,
      clientY: cursorY,
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseEvent);
    console.log("Mouse click at:", cursorX, cursorY, "on", element);

    isClickingAllowed.current = false;
    setTimeout(() => (isClickingAllowed.current = true), 500);
};

  let lastIndexY = null;
  let isPinching = false;
  let pinchStableCounter = 0; // Prevents false positives


  const detectScrollGesture = (landmarks) => {
      const indexFingerTip = landmarks[8];
      const thumbTip = landmarks[4];

      const pinchDistance = Math.hypot(
          indexFingerTip.x - thumbTip.x,
          indexFingerTip.y - thumbTip.y
      );

      const TOUCH_THRESHOLD = 0.025; // Increase if pinch is not detected
      const pinchingNow = pinchDistance < TOUCH_THRESHOLD;

      if (pinchingNow) {
          console.log("✅ Pinching!");

          if (!isPinching) {
              isPinching = true;
              lastIndexY = indexFingerTip.y; // Save initial position
              return;
          }

          if (lastIndexY === null) return;

          const verticalMovement = lastIndexY - indexFingerTip.y;
          lastIndexY = indexFingerTip.y; // Update last position

          if (Math.abs(verticalMovement) > 0.002) {
            const baseSpeed = 15000; // Adjust this value
            let scrollSpeed = verticalMovement * baseSpeed;

            // Ensure a minimum scroll effect
            // if (Math.abs(scrollSpeed) < 20) {
            //     scrollSpeed = scrollSpeed > 0 ? 20 : -20;
            // }

              console.log(`📜 Scrolling: ${scrollSpeed}px`);
              simulateScroll(scrollSpeed);
          }
      } else {
          isPinching = false;
          lastIndexY = null;
      }
  };



const simulateScroll = (scrollAmount) => {
  const element = document.elementFromPoint(cursorX, cursorY);
  const scrollableParent = getScrollableParent(element);

  if (scrollableParent) {
      console.log(`📜 Scrolling by: ${scrollAmount}px`);
      scrollableParent.scrollBy({ top: scrollAmount, behavior: "smooth" });
  } else {
      console.log("❌ No scrollable parent found");
  }
};

const getScrollableParent = (element) => {
  while (element) {
      const style = window.getComputedStyle(element);
      if (style.overflowY === "scroll" || style.overflowY === "auto") {
          return element;
      }
      element = element.parentElement;
  }
  return document.documentElement; // Default to full-page scrolling
};


  return (
    <div>
        <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          width: "200px",
          height: "200px",
          zIndex: 9999,
          transform: "scaleX(-1)",
          display: showDisplay ? "block" : "none",
          borderRadius: "10px",
        }}
      />
    </div>
  );
};

export default HandMouseControl;
