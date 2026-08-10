import { useEffect, useRef, useState } from "react";
import style from "./handTrack.module.scss";


const HandMouseControl = ({ showDisplay }) => {
  const videoRef = useRef(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const [deviceId, setDeviceId] = useState(null);

  const posRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const prevPosRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isClickingAllowedRef = useRef(true);
  const isPinchingRef = useRef(false);
  const lastYRef = useRef(null);
  const lastFrameTimeRef = useRef(0);

  const clickSoundRef = useRef(null);

  useEffect(() => {
    clickSoundRef.current = new Audio("https://res.cloudinary.com/dr6gycjza/video/upload/v1743244799/WhatsApp_Audio_2025-03-29_at_16.05.44_bedba3c6_drhc7w.mp3");

    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (videoDevices.length > 0) {
        setDeviceId(videoDevices[0].deviceId);
      }
    }).catch(err => console.error("Device enumeration error:", err));
  }, []);

  const moveCursor = (targetX, targetY) => {
    const smoothingFactor = 0.35; // Responsive smooth factor
    const curX = prevPosRef.current.x + (targetX - prevPosRef.current.x) * smoothingFactor;
    const curY = prevPosRef.current.y + (targetY - prevPosRef.current.y) * smoothingFactor;

    prevPosRef.current = { x: curX, y: curY };
    posRef.current = { x: curX, y: curY };

    let cursor = document.getElementById("customCursor");
    if (!cursor) {
      cursor = document.createElement("div");
      cursor.id = "customCursor";
      cursor.style.position = "fixed";
      cursor.style.top = "0";
      cursor.style.left = "0";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "999999";
      cursor.style.willChange = "transform";

      const verticalLine = document.createElement("div");
      verticalLine.style.position = "absolute";
      verticalLine.style.width = "2px";
      verticalLine.style.height = "22px";
      verticalLine.style.background = "var(--primary-color, #0094f6)";
      verticalLine.style.left = "50%";
      verticalLine.style.top = "50%";
      verticalLine.style.transform = "translate(-50%, -50%)";
      cursor.appendChild(verticalLine);

      const horizontalLine = document.createElement("div");
      horizontalLine.style.position = "absolute";
      horizontalLine.style.width = "22px";
      horizontalLine.style.height = "2px";
      horizontalLine.style.background = "var(--primary-color, #0094f6)";
      horizontalLine.style.left = "50%";
      horizontalLine.style.top = "50%";
      horizontalLine.style.transform = "translate(-50%, -50%)";
      cursor.appendChild(horizontalLine);

      document.body.appendChild(cursor);
    }

    cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
  };

  const simulateClick = () => {
    if (!isClickingAllowedRef.current) return;

    const { x, y } = posRef.current;
    const element = document.elementFromPoint(x, y);
    if (!element) return;

    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }

    const mouseEvent = new MouseEvent("click", {
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
      view: window,
    });

    element.dispatchEvent(mouseEvent);
    isClickingAllowedRef.current = false;
    setTimeout(() => {
      isClickingAllowedRef.current = true;
    }, 450);
  };

  const detectScrollGesture = (landmarks) => {
    const indexFingerTip = landmarks[8];
    const thumbTip = landmarks[4];

    const pinchDistance = Math.hypot(
      indexFingerTip.x - thumbTip.x,
      indexFingerTip.y - thumbTip.y
    );

    const TOUCH_THRESHOLD = 0.035;
    const pinchingNow = pinchDistance < TOUCH_THRESHOLD;

    if (pinchingNow) {
      if (!isPinchingRef.current) {
        isPinchingRef.current = true;
        lastYRef.current = indexFingerTip.y;
        return;
      }

      if (lastYRef.current === null) return;

      const verticalMovement = lastYRef.current - indexFingerTip.y;
      lastYRef.current = indexFingerTip.y;

      if (Math.abs(verticalMovement) > 0.003) {
        const scrollSpeed = verticalMovement * 12000;
        simulateScroll(scrollSpeed);
      }
    } else {
      isPinchingRef.current = false;
      lastYRef.current = null;
    }
  };

  const simulateScroll = (scrollAmount) => {
    const { x, y } = posRef.current;
    const element = document.elementFromPoint(x, y);
    const scrollableParent = getScrollableParent(element);

    if (scrollableParent) {
      scrollableParent.scrollBy({ top: scrollAmount, behavior: "smooth" });
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
    return document.documentElement;
  };

  useEffect(() => {
    if (!window.Hands || !deviceId) return;

    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65,
      modelComplexity: 0, // Lite model for maximum speed and zero lag
    });

    handsRef.current = hands;

    hands.onResults((results) => {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        return;
      }

      const landmarks = results.multiHandLandmarks[0];
      const indexFingerTip = landmarks[8];
      const thumbTip = landmarks[4];

      const pinchDistance = Math.hypot(
        indexFingerTip.x - thumbTip.x,
        indexFingerTip.y - thumbTip.y
      );

      let targetX = window.innerWidth - indexFingerTip.x * window.innerWidth;
      let targetY = indexFingerTip.y * window.innerHeight;
      moveCursor(targetX, targetY);

      if (pinchDistance < 0.04 && isClickingAllowedRef.current) {
        simulateClick();
      }

      detectScrollGesture(landmarks);
    });

    let isMounted = true;

    window.navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } }
    })
      .then((stream) => {
        if (!isMounted) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            const now = performance.now();
            // Throttle frame processing to ~30 FPS (33ms interval)
            if (now - lastFrameTimeRef.current < 30) return;
            lastFrameTimeRef.current = now;

            if (isMounted && handsRef.current && videoRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        camera.start();
      })
      .catch((error) => console.error("Hand tracking camera error:", error));

    return () => {
      isMounted = false;
      try {
        handsRef.current?.close();
      } catch (e) {}
      const cursor = document.getElementById("customCursor");
      if (cursor) cursor.remove();
    };
  }, [deviceId]);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: showDisplay ? "block" : "none" }}
        className={style.video}
      />
    </div>
  );
};

export default HandMouseControl;
