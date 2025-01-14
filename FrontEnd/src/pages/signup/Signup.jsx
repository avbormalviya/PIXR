import { useState } from "react"
import { Input } from "../../components/input/Input"
import style from "./signup.module.scss"
import { useNavigate } from "react-router-dom"

import { useRegisterUserMutation } from "../../api/userApi"
import { useDispatch } from "react-redux"

import { setVerificationCode } from "../../features/user/useSlice"

export const SignUp = () => {
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const [registerUser, { isLoading }] = useRegisterUserMutation();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const { data } = await registerUser({ email, userName: username, password }).unwrap();
            dispatch(setVerificationCode(data.verificationCode));
            navigate("/auth/signup/verifyEmail");
        } 
        catch (err) {
            console.log(err);
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} method="post">
                <h2>Start For Free</h2>
                <h1>Create new account<span /></h1>
                <h3>Already A Member? <span onClick={() => navigate("/auth/login")}>Log In</span></h3>

                <div className={style.input_wrapper}>
                    <Input state={email} setState={setEmail} placeholder="Email" icon="mail" />
                    <Input state={username} setState={setUsername} placeholder="Username" icon="account_box" />
                    <Input state={password} setState={setPassword} placeholder="Password" icon="visibility" />
                </div>

                <button type="submit">Create account</button>

            </form>
        </>
    )
}