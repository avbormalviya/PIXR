import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import style from "./switchAccount.module.scss";
import { Img } from "../../components/img/Img";
import { getSavedAccounts, removeSavedAccount, switchAccount } from "../../utils/savedAccounts";

export const SwitchAccount = () => {
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
    };

    const handleRemove = (e, userId) => {
        e.stopPropagation();
        const updated = removeSavedAccount(userId);
        setSavedAccounts(updated);
    };

    const otherAccounts = savedAccounts.filter((acc) => acc._id !== currentUser?._id);

    return (
        <section className={style.switch_account_section}>
            <div className={style.header_bar}>
                <h1 className={style.switch_account_heading}>Accounts</h1>
                <button
                    type="button"
                    className={style.add_account_btn}
                    onClick={() => navigate("/auth/login")}
                    title="Add another existing account"
                >
                    <i className="material-symbols-rounded">add</i>
                    <span>Add</span>
                </button>
            </div>

            {/* Active User Card */}
            {currentUser && (
                <div className={`${style.account_card} ${style.active}`}>
                    <div className={style.avatar_wrapper}>
                        <Img url={currentUser.profilePic} alt="" />
                    </div>
                    <div className={style.account_info}>
                        <h2>{currentUser.fullName || `@${currentUser.userName}`}</h2>
                        <p>@{currentUser.userName}</p>
                    </div>
                    <span className={style.active_badge}>Active</span>
                </div>
            )}

            {/* Other Saved Accounts */}
            {otherAccounts.length > 0 ? (
                <div className={style.saved_list}>
                    {otherAccounts.map((acc) => (
                        <div
                            key={acc._id}
                            className={style.account_card}
                            onClick={() => handleSwitch(acc)}
                        >
                            <div className={style.avatar_wrapper}>
                                <Img url={acc.profilePic} alt="" />
                            </div>
                            <div className={style.account_info}>
                                <h2>{acc.fullName || `@${acc.userName}`}</h2>
                                <p>@{acc.userName}</p>
                            </div>
                            <div className={style.action_group}>
                                <button
                                    type="button"
                                    className={style.switch_btn}
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
                                    className={style.remove_btn}
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
                <p className={style.no_other_text}>No other saved accounts on this device.</p>
            )}
        </section>
    );
};