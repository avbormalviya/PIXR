export async function isAuthCookieWorking() {
    try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/getUser`, {
            method: "GET",
            credentials: "include", // Important: sends cookies
        });

        return res.status === 200;
    } catch (e) {
        return false;
    }
}
