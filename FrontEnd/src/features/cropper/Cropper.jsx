import { FloatingCon } from "../../components/floatingContainer/FloatingCon";
import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "../../utils/getCropImage";
import style from "./cropper.module.scss";


export const ImageCropper = ({ imageSrc, onCropComplete, aspect }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleCrop = useCallback(async () => {
        try {
            const { src, file } = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete({ src, file });
        } catch (e) {
            console.error(e);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete]);

    return (
        <FloatingCon>
            { aspect && <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect == 1 ? 1 : 9 / 16}
                    cropShape={ aspect === 1 ? "round" : "rect" }
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteCallback}
                    onZoomChange={onZoomChange}
                    style={{ width: "100%", height: "100%" }}
                />
            }

            <div className={style.buttons_container}>
                <button className={style.cancel_btn} onClick={() => onCropComplete(null)}>
                    <i className="material-symbols-rounded">close</i>
                    Cancel
                </button>
                <button className={style.crop_btn} onClick={handleCrop}>
                    <i className="material-symbols-rounded">crop</i>
                    Crop
                </button>
            </div>

        </FloatingCon>
    );
};
