import axios from "axios";
import { setUserData } from "../features/user/useSlice";
import { showSuccess, showError } from "./toast";

const SAVED_ACCOUNTS_KEY = "pixr_saved_accounts";

export const getSavedAccounts = () => {
    try {
        const stored = localStorage.getItem(SAVED_ACCOUNTS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Error reading saved accounts:", e);
        return [];
    }
};

export const saveAccount = (user, refreshToken) => {
    if (!user || !user._id) return;
    try {
        const accounts = getSavedAccounts();
        const existingIndex = accounts.findIndex(acc => acc._id === user._id);

        const currentRefreshToken = refreshToken || user.refreshToken || (existingIndex !== -1 ? accounts[existingIndex].refreshToken : null) || localStorage.getItem("refreshToken");

        const accountData = {
            _id: user._id,
            userName: user.userName,
            fullName: user.fullName,
            profilePic: user.profilePic,
            refreshToken: currentRefreshToken,
            savedAt: new Date().toISOString()
        };

        if (existingIndex !== -1) {
            accounts[existingIndex] = { ...accounts[existingIndex], ...accountData };
        } else {
            accounts.push(accountData);
        }

        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
        console.error("Error saving account:", e);
    }
};

export const removeSavedAccount = (userId) => {
    try {
        const accounts = getSavedAccounts().filter(acc => acc._id !== userId);
        localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
        return accounts;
    } catch (e) {
        console.error("Error removing saved account:", e);
        return [];
    }
};

export const switchAccount = async (targetAccount, dispatch, navigate) => {
    if (!targetAccount || !targetAccount.refreshToken) {
        showError(`No active session saved for @${targetAccount?.userName || "user"}. Please log in.`);
        if (navigate) navigate("/auth/login");
        return false;
    }

    try {
        const response = await axios.post(
            "/api/v1/users/switchAccount",
            { refreshToken: targetAccount.refreshToken },
            { withCredentials: true }
        );

        if (response?.data?.data) {
            const { user, accessToken, refreshToken: newRefreshToken } = response.data.data;

            if (accessToken) localStorage.setItem("accessToken", accessToken);
            if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

            saveAccount(user, newRefreshToken);

            if (dispatch) {
                dispatch(setUserData(user));
            }

            showSuccess(`Switched account to @${user.userName}`);

            setTimeout(() => {
                window.location.href = "/";
            }, 300);

            return true;
        }
    } catch (error) {
        console.error("Failed to switch account:", error);
        showError(`Session expired for @${targetAccount.userName}. Please log in again.`);
        removeSavedAccount(targetAccount._id);
        if (navigate) navigate("/auth/login");
        return false;
    }
};
