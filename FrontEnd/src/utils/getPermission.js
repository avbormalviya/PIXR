export async function requestCameraAndMicAccess() {
    let cameraGranted = false;
    let micGranted = false;
    let cameraReason = null;
    let micReason = null;

    // Try camera
    try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraGranted = true;
        camStream.getTracks().forEach(track => track.stop());
    } catch (err) {
        cameraReason = err.name === "NotAllowedError" ? "Permission denied"
                        : err.name === "NotFoundError" ? "No camera found"
                        : err.name === "NotReadableError" ? "Camera in use"
                        : err.message || "Unknown camera error";
    }

    // Try mic
    try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micGranted = true;
        micStream.getTracks().forEach(track => track.stop());
    } catch (err) {
        micReason = err.name === "NotAllowedError" ? "Permission denied"
                    : err.name === "NotFoundError" ? "No mic found"
                    : err.name === "NotReadableError" ? "Mic in use"
                    : err.message || "Unknown mic error";
    }

    return {
        granted: cameraGranted && micGranted,
        camera: {
            granted: cameraGranted,
            reason: cameraReason
        },
        mic: {
            granted: micGranted,
            reason: micReason
        }
    };
}
