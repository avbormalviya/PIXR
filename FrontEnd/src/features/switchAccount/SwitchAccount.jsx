import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import style from "./switchAccount.module.scss";
import { SwitchUserCard } from "../../components/userCard/UserCard";
import { Input } from "../../components/input/Input";
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

    // Add Account form state using PIXR native Input controls
    const [showAddForm, setShowAddForm] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [password, setPassword] = useState("");
    const [inputType, setInputType] = useState("mail");
    const [formError, setFormError] = useState("");

    const [loginUser, { isLoading }] = useLoginUserMutation();

    useEffect(() => {
        const accounts = getSavedAccounts();
        setSavedAccounts(accounts);
    }, [currentUser]);

    const determineInputType = (val) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (val && val.trim().length > 0) {
            if (emailPattern.test(val)) {
                return "mail";
            } else {
                return "id_card";
            }
        }
        return "mail";
    };

    useEffect(() => {
        setInputType(determineInputType(inputValue));
    }, [inputValue]);

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
        setFormError("");

        const val = inputValue.trim();
        const pwd = password.trim();

        if (!val || !pwd) {
            setFormError("Please enter your username/email and password.");
            return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const payload = {
            email: isEmail ? val : "",
            userName: isEmail ? "" : val,
            password: pwd
        };

        try {
            const res = await loginUser(payload).unwrap();
            if (res?.data) {
                const { user, accessToken, refreshToken } = res.data;

                if (accessToken) localStorage.setItem("accessToken", accessToken);
                if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

                saveAccount(user, refreshToken);
                dispatch(setUserData(user));

                showSuccess(`Account @${user.userName} added successfully!`);

                setInputValue("");
                setPassword("");
                setShowAddForm(false);

                if (onClose) onClose();

                setTimeout(() => {
                    window.location.href = "/";
                }, 300);
            }
        } catch (err) {
            console.error("Add account login error:", err);
            const errText = err?.data?.message || err?.error || "Login failed. Check credentials.";
            setFormError(errText);
            showError(errText);
        }
    };

    const otherAccounts = savedAccounts.filter((acc) => acc._id !== currentUser?._id);

    return (
        <section className={`${style.switch_account_section} ${isModal ? style.modal_view : ""}`}>
            {!showAddForm ? (
                <>
                    <div className={style.header_row}>
                        <h1 className={style.switch_account_heading}>Switch Account</h1>
                        <button
                            type="button"
                            className={style.add_btn_toggle}
                            onClick={() => setShowAddForm(true)}
                            title="Add existing account"
                        >
                            <i className="material-symbols-rounded">person_add</i>
                            <span>Add</span>
                        </button>
                    </div>

                    {/* Active Current User Card */}
                    {currentUser && (
                        <div className={style.active_user_wrapper}>
                            <SwitchUserCard
                                name={currentUser.fullName}
                                userName={currentUser.userName}
                                profilePic={currentUser.profilePic}
                                follow={false}
                            />
                            <span className={style.active_label}>Active</span>
                        </div>
                    )}

                    {/* Other Saved Accounts */}
                    {otherAccounts.length > 0 ? (
                        <div className={style.saved_accounts_list}>
                            {otherAccounts.map((acc) => (
                                <div key={acc._id} className={style.saved_card_wrapper}>
                                    <SwitchUserCard
                                        name={acc.fullName}
                                        userName={acc.userName}
                                        profilePic={acc.profilePic}
                                        follow={false}
                                        event={() => handleSwitch(acc)}
                                    />
                                    <button
                                        type="button"
                                        className={style.remove_acc_btn}
                                        onClick={(e) => handleRemove(e, acc._id)}
                                        title="Remove saved account"
                                    >
                                        <i className="material-symbols-rounded">close</i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={style.no_accounts_prompt}>
                            <p>No other accounts logged in on this device.</p>
                            <button
                                type="button"
                                className={style.add_account_main_btn}
                                onClick={() => setShowAddForm(true)}
                            >
                                <i className="material-symbols-rounded">person_add</i>
                                <span>Add An Existing Account</span>
                            </button>
                        </div>
                    )}
                </>
            ) : (
                /* Add Account Login Form using PIXR native Input components */
                <form className={style.add_account_form} onSubmit={handleAddAccountSubmit}>
                    <div className={style.form_header}>
                        <button
                            type="button"
                            className={style.back_to_list_btn}
                            onClick={() => {
                                setShowAddForm(false);
                                setFormError("");
                            }}
                        >
                            <i className="material-symbols-rounded">arrow_back</i>
                            <span>Back</span>
                        </button>
                        <h2 className={style.form_heading}>Log In to Add Account</h2>
                    </div>

                    {formError && <div className={style.error_banner}>{formError}</div>}

                    <div className={style.inputs_container}>
                        <Input
                            state={inputValue}
                            setState={setInputValue}
                            placeholder="Username or Email"
                            type="text"
                            icon={inputType}
                        />
                        <Input
                            state={password}
                            setState={setPassword}
                            placeholder="Password"
                            type="password"
                            icon="visibility"
                        />
                    </div>

                    <button type="submit" className={style.login_submit_button} disabled={isLoading}>
                        {isLoading ? "Logging in..." : "Log In & Add Account"}
                    </button>
                </form>
            )}
        </section>
    );
};