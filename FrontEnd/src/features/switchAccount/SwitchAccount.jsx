import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import style from "./switchAccount.module.scss";
import { Img } from "../../components/img/Img";
import { getSavedAccounts, removeSavedAccount, switchAccount } from "../../utils/savedAccounts";

export const SwitchAccount = ({ isModal = false, onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state) => state.user);

    const [savedAccounts, setSavedAccounts] = useState([]);
    const [switchingId, setSwitchingId] = useState(null);

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

    const otherAccounts = savedAccounts.filter((acc) => acc._id !== currentUser?._id);

    return (
        <div className={`${style.switch_account_card} ${isModal ? style.modal_layout : ""}`}>
            <div className={style.header_bar}>
                <div className={style.title_area}>
                    <i className="material-symbols-rounded">switch_account</i>
                    <span>Switch Account</span>
                </div>
                <button
                    type="button"
                    className={style.add_account_btn}
                    onClick={() => {
                        if (onClose) onClose();
                        navigate("/auth/login");
                    }}
                    title="Add another account"
                >
                    <i className="material-symbols-rounded">add</i>
                    <span>Add</span>
                </button>
            </div>

            {/* Active Current Account */}
            {currentUser && (
                <div className={`${style.account_row} ${style.active_row}`}>
                    <div className={style.avatar}>
                        <Img url={currentUser.profilePic} alt="" />
                    </div>
                    <div className={style.user_info}>
                        <h4>{currentUser.fullName || `@${currentUser.userName}`}</h4>
                        <p>@{currentUser.userName}</p>
                    </div>
                    <span className={style.active_dot} title="Active Account">
                        <i className="material-symbols-rounded">check_circle</i>
                    </span>
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
                                    title="Remove account from device"
                                >
                                    <i className="material-symbols-rounded">close</i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className={style.empty_text}>No other saved accounts on this device</p>
            )}
        </div>
    );
};