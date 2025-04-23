import style from "./otp.module.scss"
import { useState, useEffect, useRef } from "react";

import { Loader } from "../../features/statusSlice/loader/Loader"

import { useNavigate } from "react-router-dom"
import { useVerifyEmailMutation } from "../../api/userApi"
import { useSocket } from "../../context/SocketContext";

import { useSelector } from 'react-redux'

export const Otp = () => {
    const navigate = useNavigate();

    const { verificationCode } = useSelector(state => state.user);

    const [ verifyEmail, { isLoading } ] = useVerifyEmailMutation();

    const [ otp, setOtp ] = useState(new Array(6).fill(""));
    const inputsRef = useRef([]);

    const { on } = useSocket();

    useEffect(() => {
        inputsRef.current[0].focus();
        handleManualPaste(localStorage.getItem("verificationCode"));
    }, [])

    useEffect(() => {
        if (verificationCode && verificationCode.trim() !== "") {
            localStorage.setItem("verificationCode", verificationCode);
            handleManualPaste(verificationCode);
        }
    }, [verificationCode]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await verifyEmail({ verificationCode: otp.join("") }).unwrap();
            navigate("/auth/signup/userDetails");
        } catch (err) {
            console.log(err)
        }
    }

    const handleManualPaste = (data) => {
        const pastedData = data.trim();

        if (/^\d+$/.test(pastedData)) {
            const pastedArray = pastedData.split('').slice(0, 6);
            const newOtp = [...otp];

            pastedArray.forEach((digit, index) => {
                newOtp[index] = digit;
            });

            setOtp(newOtp);
        }
    };

    const handlePaste = (e) => {
        const pastedData = e.clipboardData.getData('text').trim();

        if (/^\d+$/.test(pastedData)) {
            const pastedArray = pastedData.split('').slice(0, 6);
            const newOtp = [...otp];

            pastedArray.forEach((digit, index) => {
                newOtp[index] = digit;
            });

            setOtp(newOtp);
        }
    };

    const handleChange = (e, index) => {
        const { value } = e.target;

        if (!/^\d$/.test(value) && value !== "") return;

        setOtp((prevOtp) => {
            prevOtp[index] = value;
            return [...prevOtp];
        })

        if (value.length === 1 && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1].focus();
        }
    }

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} method="post">
                <h2>Enter 6-Digit Code Sent To Your Email</h2>
                <h1>Verify Your Email<span /></h1>

                <div className={style.input_wrapper}>

                    {
                        otp.map((digit, index) => (
                            <input
                                key={ index }
                                type="text"
                                maxLength="1"
                                className={style.otp_digit}
                                value={ digit }
                                onChange={(e) => handleChange(e, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                ref={(el) => (inputsRef.current[index] = el)}
                            />
                        ))
                    }
                </div>

                <button type="submit">Verify</button>
            </form>

            { isLoading && <Loader /> }
        </>
    )
}
