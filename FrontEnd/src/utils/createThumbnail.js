const isValidVideoFile = (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    return validTypes.includes(file.type);
};

export const createThumbnail = (file) => {
    return new Promise((resolve, reject) => {
        if (file instanceof Blob && !isValidVideoFile(file)) {
            reject(new Error('Invalid video file type'));
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const video = document.createElement('video');

        if (file instanceof Blob) {
            video.src = URL.createObjectURL(file);
        } else {
            video.src = file;
            video.crossOrigin = 'anonymous';
        }

        video.load();

        video.addEventListener('loadeddata', function() {
            video.currentTime = 5;
        });

        video.addEventListener('seeked', function() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const thumbnailURL = canvas.toDataURL('image/png');
            resolve(thumbnailURL);
        });

        video.onerror = function(error) {
            console.error("Video error:", error);
            reject(new Error('Failed to load the video file'));
        };
    });
};
