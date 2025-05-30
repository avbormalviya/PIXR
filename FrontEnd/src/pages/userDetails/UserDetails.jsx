import { Input } from "../../components/input/Input";
import { FileInput } from "../../features/fileInput/FileInput";

import { ImageCropper } from "../../features/cropper/Cropper";

import { useState, useEffect } from "react";

import style from "./userDetails.module.scss"

import { useNavigate } from "react-router-dom"
import { useUserProfileMutation } from "../../api/userApi"
import { useDispatch } from "react-redux"
import { setUserData } from "../../features/user/useSlice"
import { FaceCapture } from "../../features/faceRecog/FaceRecog";
import { requestCameraAndMicAccess } from "../../utils/getPermission";
import { CircularProgress } from "@mui/material";
import { useFaceTracker } from "../../hooks/useFaceTracker";

export const UserDetails = () => {
    const navigate = useNavigate();

    const [userProfile, { data, isLoading }] = useUserProfileMutation();
    const dispatch = useDispatch();

    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [profilePic, setProfilePic] = useState({src:"https://static.vecteezy.com/system/resources/previews/020/765/399/original/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg", file: ""});
    const [cropImage, setCropImage] = useState({});
    const [descriptor, setDescriptor] = useState([]);
    const [faceId, setFaceId] = useState("");
    const [isPermissionsGranted, setIsPermissionsGranted] = useState(false);

    const { status, error, canRetry, retry } = useFaceTracker({
        onFaceDetected: (descriptor, file) => {
            setDescriptor(descriptor);
            setFaceId(file);
        },
        timeout: 8000
    });

    const fetchImageAsFile = async () => {
        const response = await fetch(profilePic.src);
        const blob = await response.blob();
        const file = new File([blob], "default-profile.jpg", { type: blob.type });

        setProfilePic((prev) => ({
            ...prev,
            file: file,
        }));
    };

    useEffect(() => {
        fetchImageAsFile();
    }, []);

    useEffect(() => {
        ( async () => {
            const result = await requestCameraAndMicAccess();
            setIsPermissionsGranted(result);
        })();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("birthDate", birthDate);
        formData.append("profilePic", profilePic.file);
        formData.append("descriptor", descriptor);
        formData.append("faceId", faceId);

        try {
            const result = await userProfile(formData).unwrap();
            dispatch(setUserData(result.data));
            navigate("/");
        }
        catch (err) {
            console.log(err);
        }
    }

    const onCropComplete = (data) => {
        setProfilePic({ src: data.src, file: data.file });
        setCropImage({});
    }

    return (
        <>
            <form onSubmit={handleSubmit} method="post">
                <h2>Please Enter Your Details</h2>
                <h1>Create Profile<span /></h1>

                <div className={style.input_wrapper}>
                    <FileInput profilePic={ profilePic } setProfilePic={ setCropImage } />
                    <Input state={ fullName } setState={ setFullName } placeholder="Full Name" type="text" icon="id_card" />
                    <Input state={ birthDate } setState={ setBirthDate } placeholder="Birth Date" type="date" icon="calendar_month" />

                    <button
                        type="button"
                        className={style.face_recognition}
                        style={{ boxShadow: descriptor.length ? "0 0 0 2px var(--primary-color), 0 0 0 6px #0094f624" : "none" }}
                        disabled={ !isPermissionsGranted?.camera?.granted }
                    >
                        Face Recognition
                        <span className={style.fr_loader} style={{ color
                            : error ? "red" : "rgba(245, 245, 245, 0.5)"
                        }}>
                            { status }
                            { !error && !descriptor.length && <CircularProgress size={15} /> }
                            { canRetry && <button className={style.fr_retry} onClick={retry}>Retry</button> }
                        </span>

                        <span className={style.fr_shine} />
                    </button>
                </div>

                <button type="submit">Create</button>
            </form>

            { cropImage.src && <ImageCropper imageSrc={ cropImage.src } onCropComplete={ onCropComplete } aspect={ 1 } />}
        </>
    )
}
