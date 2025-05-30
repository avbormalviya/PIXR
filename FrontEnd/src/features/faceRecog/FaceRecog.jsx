import { useEffect, useState } from "react";
import * as faceapi from "face-api.js";

export const FaceCapture = ({ setFaceCapture, setDescriptor, setStatus, setError }) => {

    useEffect(() => {
        let video;
        let stream;
        let intervalId;

        const loadModels = async () => {
            try {
                await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                setStatus("Models loaded ✅");
                startFaceTracking();
            } catch (err) {
                console.error("Model load failed:", err);
                setStatus("Model loading failed");
                setError("Model loading failed");
            }
        };

        const startFaceTracking = async () => {
            try {
                setStatus("Accessing camera");
                stream = await navigator.mediaDevices.getUserMedia({ video: true });

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

                setStatus("Looking for face");

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                intervalId = setInterval(async () => {
                    if (!video.videoWidth || !video.videoHeight) return;

                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    const detection = await faceapi
                        .detectSingleFace(canvas, new faceapi.SsdMobilenetv1Options())
                        .withFaceLandmarks()
                        .withFaceDescriptor();

                    if (detection) {
                        const descriptor = Array.from(detection.descriptor);
                        setDescriptor(descriptor);
                        setStatus("Face captured!");
                        setFaceCapture(true);

                        // Stop everything
                        clearInterval(intervalId);
                        stream.getTracks().forEach((t) => t.stop());
                    }
                }, 1000); // Adjust frequency here (ms)
            } catch (err) {
                console.error("Camera error:", err);
                setStatus("Camera access failed");
                setError("Camera access failed");
            }
        };

        loadModels();

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (stream) stream.getTracks().forEach((t) => t.stop());
        };
    }, []);
};
