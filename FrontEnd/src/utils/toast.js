// Global toast event bus — allows any component to trigger a toast
const listeners = [];

export const toastBus = {
    show: (toast) => listeners.forEach(cb => cb(toast)),
    subscribe: (cb) => {
        listeners.push(cb);
        return () => {
            const idx = listeners.indexOf(cb);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }
};

export const showToast = ({ title, body, type = "info", avatar, link, duration = 4500 }) => {
    toastBus.show({ title, body, type, avatar, link, duration });
};

export const showError = (message) => showToast({ title: "Error", body: message, type: "error" });
export const showSuccess = (message) => showToast({ title: "Success", body: message, type: "success" });
