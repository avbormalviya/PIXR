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


export const UserDetails = () => {
    const navigate = useNavigate();

    const [userProfile, { data, error, isLoading }] = useUserProfileMutation();
    const dispatch = useDispatch();

    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [profilePic, setProfilePic] = useState({src:"https://static.vecteezy.com/system/resources/previews/020/765/399/original/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg", file: ""});
    const [cropImage, setCropImage] = useState({});
    const [faceCapture, setFaceCapture] = useState(false);
    const [descriptor, setDescriptor] = useState([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("birthDate", birthDate);
        formData.append("profilePic", profilePic.file);
        formData.append("descriptor", descriptor);

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
                    <Input state={ fullName } setState={ setFullName } placeholder="Full Name" icon="id_card" />
                    <Input state={ birthDate } setState={ setBirthDate } placeholder="Birth Date" icon="calendar_month" />
                    <button
                        type="button"
                        className={style.face_recognition}
                        onClick={() => setFaceCapture(true)}
                        style={{ boxShadow: descriptor.length ? "0 0 0 2px var(--primary-color), 0 0 0 6px #0094f624" : "none" }}
                    >
                        Face Recognition
                    </button>
                </div>

                <button type="submit">Create</button>
            </form>

            { cropImage.src && <ImageCropper imageSrc={ cropImage.src } onCropComplete={ onCropComplete } aspect={ 1 } />}
            { faceCapture && <FaceCapture setFaceCapture={ setFaceCapture } setDescriptor={ setDescriptor } /> }
        </>
    )
}
