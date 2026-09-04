import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import style from "./switchAccount.module.scss";
import { Img } from "../../components/img/Img";
import { getSavedAccounts, removeSavedAccount, switchAccount, saveAccount } from "../../utils/savedAccounts";
import { useLoginUserMutation } from "../../api/userApi";
import { setUserData } from "../../features/user/useSlice";
import { showSuccess, showError } from "../../utils/toast";

export const SwitchAccount = ({ isModal = false, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state) => state.user);

    const [savedAccounts, setSavedAccounts] = useState([]);
    const [switchingId, setSwitchingId] = useState(null);

    // Inline Add Account state
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [accountInput, setAccountInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [loginErrorMsg, setLoginErrorMsg] = useState("");

    const [loginUser, { isLoading: isLoginLoading }] = useLoginUserMutation();

    useEffect(() => {
        const accounts = getSavedAccounts();
        setSavedAccounts(accounts);
    }, [currentUser]);

    const handleSwitch = async (account) => {
        if (account._id === currentUser?._id) return;
        setSwitchingId(account._id);
        await switchAccount(account, dispatch, navigate);
        setSwitchingId(null);
        if (onClose) onClose();
    };

    const handleRemove = (e, userId) => {
        e.stopPropagation();
        const updated = removeSavedAccount(userId);
        setSavedAccounts(updated);
    };

    const handleAddAccountSubmit = async (e) => {
        e.preventDefault();
        setLoginErrorMsg("");

        const inputVal = accountInput.trim();
        const pwdVal = passwordInput.trim();

        if (!inputVal || !pwdVal) {
            setLoginErrorMsg("Please fill in both username/email and password.");
            return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputVal);
        const loginPayload = {
            email: isEmail ? inputVal : "",
            userName: isEmail ? "" : inputVal,
            password: pwdVal
        };

        try {
            const res = await loginUser(loginPayload).unwrap();
            if (res?.data) {
                const { user, accessToken, refreshToken } = res.data;

                if (accessToken) localStorage.setItem("accessToken", accessToken);
                if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

                saveAccount(user, refreshToken);
                dispatch(setUserData(user));

                showSuccess(`Account @${user.userName} added and logged in!`);

                setAccountInput("");
                setPasswordInput("");
                setShowLoginForm(false);

                if (onClose) onClose();

                setTimeout(() => {
                    window.location.href = "/";
                }, 300);
            }
        } catch (err) {
            console.error("Add account login error:", err);
            const errorText = err?.data?.message || err?.error || "Login failed. Check credentials.";
            setLoginErrorMsg(errorText);
            showError(errorText);
        }
    };

    const otherAccounts = savedAccounts.filter((acc) => acc._id !== currentUser?._id);

    return (
        <div className={`${style.switch_account_card} ${isModal ? style.modal_layout : ""}`}>
            {!showLoginForm ? (
                <>
                    <div className={style.header_bar}>
                        <div className={style.title_area}>
                            <i className="material-symbols-rounded">switch_account</i>
                            <span>Switch Account</span>
                        </div>
                        <button
                            type="button"
                            className={style.add_account_btn}
                            onClick={() => setShowLoginForm(true)}
                            title="Add existing account"
                        >
                            <i className="material-symbols-rounded">add</i>
                            <span>Add</span>
                        </button>
                    </div>

                    {/* Active Current User */}
                    {currentUser && (
                        <div className={`${style.account_row} ${style.active_row}`}>
                            <div className={style.avatar}>
                                <Img url={currentUser.profilePic} alt="" />
                            </div>
                            <div className={style.user_info}>
                                <h4>{currentUser.fullName || `@${currentUser.userName}`}</h4>
                                <p>@{currentUser.userName}</p>
                            </div>
                            <span className={style.active_badge}>Active</span>
                        </div>
                    )}

                    {/* Other Saved Accounts */}
                    {otherAccounts.length > 0 ? (
                        <div className={style.accounts_list}>
                            {otherAccounts.map((acc) => (
                                <div
                                    key={acc._id}
                                    className={style.account_row}
                                    onClick={() => handleSwitch(acc)}
                                >
                                    <div className={style.avatar}>
                                        <Img url={acc.profilePic} alt="" />
                                    </div>
                                    <div className={style.user_info}>
                                        <h4>{acc.fullName || `@${acc.userName}`}</h4>
                                        <p>@{acc.userName}</p>
                                    </div>
                                    <div className={style.row_actions}>
                                        <button
                                            type="button"
                                            className={style.switch_pill}
                                            disabled={switchingId === acc._id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSwitch(acc);
                                            }}
                                        >
                                            {switchingId === acc._id ? "..." : "Switch"}
                                        </button>
                                        <button
                                            type="button"
                                            className={style.remove_icon}
                                            onClick={(e) => handleRemove(e, acc._id)}
                                            title="Remove from saved accounts"
                                        >
                                            <i className="material-symbols-rounded">close</i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={style.empty_container}>
                            <p>No other accounts on this device.</p>
                            <button
                                type="button"
                                className={style.big_add_btn}
                                onClick={() => setShowLoginForm(true)}
                            >
                                <i className="material-symbols-rounded">add_circle</i>
                                <span>Add An Account</span>
                            </button>
                        </div>
                    )}
                </>
            ) : (
                /* Inline Add Account Login Form */
                <form className={style.login_form} onSubmit={handleAddAccountSubmit}>
                    <div className={style.header_bar}>
                        <button
                            type="button"
                            className={style.back_btn}
                            onClick={() => {
                                setShowLoginForm(false);
                                setLoginErrorMsg("");
                            }}
                        >
                            <i className="material-symbols-rounded">arrow_back</i>
                            <span>Back</span>
                        </button>
                        <span className={style.form_title}>Add Account</span>
                    </div>

                    {loginErrorMsg && <div className={style.error_banner}>{loginErrorMsg}</div>}

                    <div className={style.form_group}>
                        <label>Username or Email</label>
                        <input
                            type="text"
                            placeholder="Enter username or email"
                            value={accountInput}
                            onChange={(e) => setAccountInput(e.target.value)}
                            required
                        />
                    </div>

                    <div className={style.form_group}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className={style.submit_login_btn} disabled={isLoginLoading}>
                        {isLoginLoading ? "Logging In..." : "Log In & Add Account"}
                    </button>
                </form>
            )}
        </div>
    );
};