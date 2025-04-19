function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

function rotateSize(width, height, rotation) {
    const rotRad = getRadianAngle(rotation);
    return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, flip = { horizontal: false, vertical: false }) => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = 'anonymous';
    await new Promise((resolve) => {
        image.onload = resolve;
    });

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    const canvas = document.createElement('canvas');
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;
    const ctx = canvas.getContext('2d');

    // Center context and apply transformations
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    // Create new canvas for the actual crop
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = pixelCrop.width;
    finalCanvas.height = pixelCrop.height;
    const finalCtx = finalCanvas.getContext('2d');

    // Draw cropped area
    finalCtx.drawImage(
        canvas,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        finalCanvas.toBlob((blob) => {
            const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });
            const src = URL.createObjectURL(blob);
            resolve({ src, file });
        }, 'image/jpeg');
    });
};
