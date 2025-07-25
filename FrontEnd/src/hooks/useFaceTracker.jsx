import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

export const useFaceTracker = ({
    onFaceDetected,
    timeout = 10000,
    runOnMount = true
}) => {
    const [status, setStatus] = useState("Initializing");
    const [canRetry, setCanRetry] = useState(false);
    const [error, setError] = useState(false);
    const videoRef = useRef(null);
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const streamRef = useRef(null);

    const loadModels = async () => {
        setStatus("Loading models");
        await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    };

    const cleanup = () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const detectFace = async () => {
        setStatus("Accessing camera");
        setCanRetry(false);

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });

            const video = document.createElement("video");
            videoRef.current = video;
            video.srcObject = streamRef.current;
            video.muted = true;
            video.playsInline = true;

            await new Promise((resolve) => {
                video.onloadeddata = () => {
                    video.play();
                    resolve();
                };
            });

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            setStatus("Looking for face");

            intervalRef.current = setInterval(async () => {
                if (!video.videoWidth) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);

                const detection = await faceapi
                    .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    canvas.toBlob((blob) => {
                        const file = new File([blob], "face-frame.png", { type: "image/png" });
                        const imageUrl = URL.createObjectURL(blob);

                        cleanup();
                        setStatus("Face detected");

                        const descriptor = Array.from(detection.descriptor);

                        // Send both descriptor and file back
                        onFaceDetected(descriptor, file, imageUrl);
                    }, "image/png");
                }
            }, 500);

            timeoutRef.current = setTimeout(() => {
                cleanup();
                setStatus("No face found");
                setError(true);
                setCanRetry(true);
            }, timeout);

        } catch (err) {
            cleanup();
            console.error("Camera error:", err);
            setStatus("Camera error");
            setError(true);
            setCanRetry(true);
        }
    };

    useEffect(() => {
        if (runOnMount) {
            loadModels().then(detectFace());
        } else {
            loadModels(); // preload models even if not detecting immediately
        }

        return () => cleanup();
    }, []);

    const retry = () => {
        setError(false);
        console.log("Retrying...");
        detectFace();
    };

    return { status, error, canRetry, retry };
};
