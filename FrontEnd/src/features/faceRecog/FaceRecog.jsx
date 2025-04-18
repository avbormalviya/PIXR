// components/FaceCapture.js
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import style from "./faceRecog.module.scss";
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded';

export const FaceCapture = ({ setFaceCapture, setDescriptor }) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);

    const [status, setStatus] = useState("Loading models...");


    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
                setStatus("Models loaded ✅");
            } catch (err) {
                console.error("Model load failed:", err);
                setStatus("Model loading failed ❌");
            }
        };

        loadModels();
    }, []);


    useEffect(() => {
        let intervalId;

        const startRealTimeDetection = async () => {
            const video = webcamRef.current?.video;
            if (!video) return;

            const canvas = canvasRef.current;

            const width = video.videoWidth;
            const height = video.videoHeight;

            if (!width || !height || isNaN(width) || isNaN(height)) {
                console.error("Invalid video dimensions:", width, height);
                return;
            }

            canvas.width = width;
            canvas.height = height;

            const displaySize = { width: video.videoWidth, height: video.videoHeight };
            faceapi.matchDimensions(canvas, displaySize);

            intervalId = setInterval(async () => {
                const detection = await faceapi
                    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options())
                    .withFaceLandmarks();

                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (detection) {
                    const resized = faceapi.resizeResults(detection, displaySize);
                    faceapi.draw.drawFaceLandmarks(canvas, resized);
                }
            }, 100); // runs every 100ms
        };

        if (webcamRef.current?.video?.readyState === 4) {
            startRealTimeDetection();
        } else {
            webcamRef.current?.video?.addEventListener("loadeddata", startRealTimeDetection);
        }

        return () => clearInterval(intervalId);
    }, []);


    const captureAndSend = async () => {
        setStatus("Detecting...");
        const screenshot = webcamRef.current.getScreenshot();

        if (!screenshot) {
            setStatus("Failed to capture image. Please try again.");
            return;
        }

        const img = new Image();
        img.src = screenshot;

        img.onload = async () => {
            const detection = await faceapi
                .detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                setStatus("No face detected.");
                return;
            }

            const descriptor = Array.from(detection.descriptor); // Convert to plain array

            console.log(descriptor);

            if (descriptor) {
                setDescriptor(descriptor);
                setStatus("Face captured!");
            }

            setFaceCapture(false);

        };
    };


    return (
        <FloatingCon className={style.faceCapture}>
            <div className={style.faceCaptureWrapper}>
                <div className={style.faceCaptureHeader}>
                    <h2>Face Recognition</h2>
                    <CloseFullscreenRoundedIcon className={style.closeIcon} onClick={() => {setFaceCapture(false)}} />
                </div>

                <div className={style.faceCaptureBody}>
                    <Webcam
                        className={style.webcam}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                    />
                    <canvas ref={canvasRef} className={style.overlayCanvas} />
                </div>

                <div className={style.faceCaptureFooter}>
                    <p className={style.status}>{status}</p>
                    <button className={style.captureButton} onClick={captureAndSend}>
                        Scan Face
                    </button>
                </div>
            </div>
        </FloatingCon>
    );
};
