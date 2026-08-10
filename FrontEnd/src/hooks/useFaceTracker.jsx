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
    const timeoutRef = useRef(null);
    const streamRef = useRef(null);
    const isMountedRef = useRef(true);
    const isDetectingRef = useRef(false);
    const nextFrameTimerRef = useRef(null);

    const loadModels = async () => {
        setStatus("Loading models");
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                faceapi.nets.faceRecognitionNet.loadFromUri("/models")
            ]);
            setStatus("Models loaded");
        } catch (err) {
            console.error("Failed to load face models:", err);
            // Fallback to ssdMobilenetv1 if tiny detector fails
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
                faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                faceapi.nets.faceRecognitionNet.loadFromUri("/models")
            ]);
        }
    };

    const cleanup = () => {
        isDetectingRef.current = false;
        if (nextFrameTimerRef.current) {
            clearTimeout(nextFrameTimerRef.current);
            nextFrameTimerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const detectFace = async () => {
        if (!isMountedRef.current) return;
        setStatus("Accessing camera");
        setCanRetry(false);
        setError(false);

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { max: 30 } }
            });

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

            if (!isMountedRef.current) {
                cleanup();
                return;
            }

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            setStatus("Looking for face");
            isDetectingRef.current = true;

            const runDetectionLoop = async () => {
                if (!isMountedRef.current || !isDetectingRef.current) return;

                if (video.videoWidth && video.videoHeight) {
                    // Downscale canvas to max width 320 for ultra-fast processing
                    const maxDim = 320;
                    const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
                    canvas.width = Math.round(video.videoWidth * scale);
                    canvas.height = Math.round(video.videoHeight * scale);

                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    let detection = null;
                    try {
                        if (faceapi.nets.tinyFaceDetector.isLoaded) {
                            detection = await faceapi
                                .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                                .withFaceLandmarks()
                                .withFaceDescriptor();
                        } else {
                            detection = await faceapi
                                .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
                                .withFaceLandmarks()
                                .withFaceDescriptor();
                        }
                    } catch (detErr) {
                        console.warn("Face detection frame error:", detErr);
                    }

                    if (detection && isMountedRef.current && isDetectingRef.current) {
                        isDetectingRef.current = false;
                        canvas.toBlob((blob) => {
                            if (!blob) return;
                            const file = new File([blob], "face-frame.png", { type: "image/png" });
                            const imageUrl = URL.createObjectURL(blob);

                            cleanup();
                            setStatus("Face detected");

                            const descriptor = Array.from(detection.descriptor);
                            onFaceDetected(descriptor, file, imageUrl);
                        }, "image/png");
                        return;
                    }
                }

                // Schedule next frame check only after previous detection completes
                if (isMountedRef.current && isDetectingRef.current) {
                    nextFrameTimerRef.current = setTimeout(runDetectionLoop, 150);
                }
            };

            runDetectionLoop();

            timeoutRef.current = setTimeout(() => {
                if (isDetectingRef.current) {
                    cleanup();
                    setStatus("No face found");
                    setError(true);
                    setCanRetry(true);
                }
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
        isMountedRef.current = true;
        if (runOnMount) {
            loadModels().then(() => {
                if (isMountedRef.current) {
                    detectFace();
                }
            });
        } else {
            loadModels();
        }

        return () => {
            isMountedRef.current = false;
            cleanup();
        };
    }, []);

    const retry = () => {
        setError(false);
        detectFace();
    };

    return { status, error, canRetry, retry };
};
