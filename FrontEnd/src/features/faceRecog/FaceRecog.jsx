import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export const FaceCapture = ({ setFaceCapture, setDescriptor, setStatus, setError }) => {

    useEffect(() => {
        let video;
        let stream;
        let isMounted = true;
        let isDetecting = true;
        let timerId = null;

        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
                    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
                    faceapi.nets.faceRecognitionNet.loadFromUri("/models")
                ]);
                if (isMounted) {
                    setStatus("Models loaded ✅");
                    startFaceTracking();
                }
            } catch (err) {
                console.error("Model load failed:", err);
                if (isMounted) {
                    setStatus("Model loading failed");
                    setError("Model loading failed");
                }
            }
        };

        const startFaceTracking = async () => {
            try {
                setStatus("Accessing camera");
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 } }
                });

                video = document.createElement("video");
                video.srcObject = stream;
                video.muted = true;
                video.playsInline = true;

                await new Promise((resolve) => {
                    video.onloadeddata = () => {
                        video.play();
                        resolve();
                    };
                });

                if (!isMounted) return;

                setStatus("Looking for face");

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d", { willReadFrequently: true });

                const detectLoop = async () => {
                    if (!isMounted || !isDetecting) return;

                    if (video.videoWidth && video.videoHeight) {
                        const maxDim = 320;
                        const scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight, 1);
                        canvas.width = Math.round(video.videoWidth * scale);
                        canvas.height = Math.round(video.videoHeight * scale);

                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        try {
                            const detection = await faceapi
                                .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
                                .withFaceLandmarks()
                                .withFaceDescriptor();

                            if (detection && isMounted && isDetecting) {
                                isDetecting = false;
                                const descriptor = Array.from(detection.descriptor);
                                setDescriptor(descriptor);
                                setStatus("Face captured!");
                                setFaceCapture(true);

                                if (stream) stream.getTracks().forEach((t) => t.stop());
                                return;
                            }
                        } catch (e) {
                            console.warn("FaceRecog detection frame error:", e);
                        }
                    }

                    if (isMounted && isDetecting) {
                        timerId = setTimeout(detectLoop, 150);
                    }
                };

                detectLoop();

            } catch (err) {
                console.error("Camera error:", err);
                if (isMounted) {
                    setStatus("Camera access failed");
                    setError("Camera access failed");
                }
            }
        };

        loadModels();

        return () => {
            isMounted = false;
            isDetecting = false;
            if (timerId) clearTimeout(timerId);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, []);
};
