export function areCookiesEnabled() {
    try {
        document.cookie = "testcookie=1";
        const enabled = document.cookie.indexOf("testcookie=") !== -1;
        document.cookie = "testcookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT"; // clean up
        return enabled;
    } catch (e) {
        return false;
    }
}
