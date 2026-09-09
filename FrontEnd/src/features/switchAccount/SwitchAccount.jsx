import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import style from "./switchAccount.module.scss";
import { Input } from "../../components/input/Input";
import { getSavedAccounts, removeSavedAccount, switchAccount, saveAccount } from "../../utils/savedAccounts";
import { useLoginUserMutation } from "../../api/userApi";
import { setUserData } from "../../features/user/useSlice";
import { showSuccess, showError } from "../../utils/toast";

export const SwitchAccount = ({ isModal: externalIsModal = false, onClose: externalOnClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state) => state.user);

    const [savedAccounts, setSavedAccounts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(externalIsModal);
    const [viewMode, setViewMode] = useState("list"); // "list" | "add"
    const [switchingId, setSwitchingId] = useState(null);

    // Add Account form state
    const [inputValue, setInputValue] = useState("");
    const [password, setPassword] = useState("");
    const [inputType, setInputType] = useState("mail");
    const [formError, setFormError] = useState("");

    const [loginUser, { isLoading }] = useLoginUserMutation();

    useEffect(() => {
        const accounts = getSavedAccounts();
        setSavedAccounts(accounts);
    }, [currentUser, isModalOpen]);

    const determineInputType = (val) => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (val && val.trim().length > 0) {
            return emailPattern.test(val) ? "mail" : "id_card";
        }
        return "mail";
    };

    useEffect(() => {
        setInputType(determineInputType(inputValue));
    }, [inputValue]);

    const handleOpenModal = () => {
        setViewMode("list");
        setFormError("");
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setViewMode("list");
        setFormError("");
        if (externalOnClose) externalOnClose();
    };

    const handleSwitch = async (account) => {
        if (account._id === currentUser?._id) return;
        setSwitchingId(account._id);
        await switchAccount(account, dispatch, navigate, currentUser);
        setSwitchingId(null);
        handleCloseModal();
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

        // ── Snapshot the CURRENT account's refreshToken before the new login call.
        // The backend regenerates tokens on every login, which would invalidate the
        // current account's stored refreshToken and break "switch back" later.
        if (currentUser) {
            const liveRefreshToken = localStorage.getItem("refreshToken");
            saveAccount(currentUser, liveRefreshToken);
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

                showSuccess(`Account @${user.userName} added!`);

                setInputValue("");
                setPassword("");
                handleCloseModal();

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
        <>
            {/* Sidebar Card: Fixed-size current user row with Switch action. Never resizes sidebar! */}
            {!externalIsModal && (
                <div className={style.sidebar_switch_card}>
                    <div className={style.user_info_group}>
                        <div className={style.avatar}>
                            <img src={currentUser?.profilePic} alt={currentUser?.userName || "user"} />
                        </div>
                        <div className={style.text_meta}>
                            <h3>{currentUser?.fullName || `@${currentUser?.userName}`}</h3>
                            <p>@{currentUser?.userName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={style.switch_action_btn}
                        onClick={handleOpenModal}
                    >
                        Switch
                    </button>
                </div>
            )}

            {/* Modal Overlay for Account Switching & Adding */}
            {(isModalOpen || externalIsModal) && (
                <div className={style.modal_backdrop} onClick={handleCloseModal}>
                    <div
                        className={style.modal_card}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {viewMode === "list" ? (
                            <>
                                <div className={style.modal_header}>
                                    <h2>Switch Accounts</h2>
                                    <button
                                        type="button"
                                        className={style.close_btn}
                                        onClick={handleCloseModal}
                                    >
                                        <i className="material-symbols-rounded">close</i>
                                    </button>
                                </div>

                                <div className={style.modal_body}>
                                    {/* Active Current User */}
                                    {currentUser && (
                                        <div className={`${style.account_item} ${style.active_item}`}>
                                            <div className={style.avatar}>
                                                <img src={currentUser.profilePic} alt={currentUser.userName} />
                                            </div>
                                            <div className={style.account_meta}>
                                                <h4>{currentUser.fullName || `@${currentUser.userName}`}</h4>
                                                <p>@{currentUser.userName}</p>
                                            </div>
                                            <i className={`material-symbols-rounded ${style.check_icon}`}>
                                                check_circle
                                            </i>
                                        </div>
                                    )}

                                    {/* Other Saved Accounts */}
                                    {otherAccounts.length > 0 ? (
                                        <div className={style.saved_accounts_group}>
                                            <span className={style.section_sublabel}>Saved Accounts</span>
                                            {otherAccounts.map((acc) => (
                                                <div
                                                    key={acc._id}
                                                    className={style.account_item}
                                                    onClick={() => handleSwitch(acc)}
                                                >
                                                    <div className={style.avatar}>
                                                        <img src={acc.profilePic} alt={acc.userName} />
                                                    </div>
                                                    <div className={style.account_meta}>
                                                        <h4>{acc.fullName || `@${acc.userName}`}</h4>
                                                        <p>@{acc.userName}</p>
                                                    </div>
                                                    <div className={style.item_actions}>
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
                                                            className={style.remove_pill}
                                                            onClick={(e) => handleRemove(e, acc._id)}
                                                            title="Remove saved account"
                                                        >
                                                            <i className="material-symbols-rounded">close</i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={style.empty_accounts_notice}>
                                            <i className="material-symbols-rounded">account_box</i>
                                            <p>No other saved accounts on this device.</p>
                                        </div>
                                    )}
                                </div>

                                <div className={style.modal_footer}>
                                    <button
                                        type="button"
                                        className={style.add_existing_account_btn}
                                        onClick={() => setViewMode("add")}
                                    >
                                        <i className="material-symbols-rounded">person_add</i>
                                        <span>Log in to an Existing Account</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* Add Account Login Form */
                            <form className={style.add_account_form} onSubmit={handleAddAccountSubmit}>
                                <div className={style.modal_header}>
                                    <button
                                        type="button"
                                        className={style.back_btn}
                                        onClick={() => {
                                            setViewMode("list");
                                            setFormError("");
                                        }}
                                    >
                                        <i className="material-symbols-rounded">arrow_back</i>
                                        <span>Back</span>
                                    </button>
                                    <h2>Add Account</h2>
                                    <button
                                        type="button"
                                        className={style.close_btn}
                                        onClick={handleCloseModal}
                                    >
                                        <i className="material-symbols-rounded">close</i>
                                    </button>
                                </div>

                                {formError && <div className={style.form_error}>{formError}</div>}

                                <div className={style.form_inputs}>
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

                                <button
                                    type="submit"
                                    className={style.submit_add_btn}
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Logging in..." : "Log In & Add Account"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};