import { useEffect, useState } from "react"
import { Input } from "../../components/input/Input"
import style from "./login.module.scss"
import { useNavigate } from "react-router-dom"

import { useLoginUserMutation } from "../../api/userApi"
import { useDispatch } from "react-redux"
import { setUserData } from "../../features/user/useSlice"
import { Loader } from "../../features/statusSlice/loader/Loader"

import { FaceCapture } from "../../features/faceRecog/FaceRecog"


export const Login = () => {
    const navigate = useNavigate();

    const [loginUser, { isLoading }] = useLoginUserMutation();

    const dispatch = useDispatch();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [inputType, setInputType] = useState('');
    const [faceCapture, setFaceCapture] = useState(false);
    const [descriptor, setDescriptor] = useState([]);

    useEffect(() => {
        setInputType(determineInputType(inputValue) || "mail");
    }, [inputValue])

    const determineInputType = (value) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernamePattern = /^[a-zA-Z0-9_.-]+$/;

        if (inputValue.trim().length > 0) {
            if (emailPattern.test(value)) {
                setEmail(value);
                return 'mail';
            } else if (usernamePattern.test(value)) {
                setUsername(value);
                return 'id_card';
            } else {
                return "dangerous"
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const result = await loginUser({ email, userName: username, password, descriptor }).unwrap();

        dispatch(setUserData(result.data));
        navigate("/");
    }

    return (
        <>
            <form onSubmit={handleSubmit} method="post">
                <h2>Please enter Your details</h2>
                <h1>Welcome Back<span /></h1>
                <h3>Don&apos;t have an account? <span onClick={() => navigate("/auth/signup")}>Sign Up</span></h3>

                <div className={style.input_wrapper}>
                    <Input state={ inputValue }  setState={ setInputValue } placeholder="Username or Email" icon={ inputType } />
                    <Input state={ password } setState={ setPassword } placeholder="Password" icon="visibility" />
                    <div className={style.divider}>
                        <hr />
                        <span>OR</span>
                        <hr />
                    </div>
                    <button
                        type="button"
                        className={style.face_recognition}
                        style={{ boxShadow: descriptor.length ? "0 0 0 2px var(--primary-color), 0 0 0 6px #0094f624" : "none" }}
                        onClick={() => setFaceCapture(true)}
                    >
                        Face Recognition
                    </button>
                </div>

                <button type="submit">Login</button>
            </form>

            { faceCapture && <FaceCapture setFaceCapture={ setFaceCapture } setDescriptor={ setDescriptor } /> }
        </>
    )
}
