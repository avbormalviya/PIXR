export class LocalStorage {
    static get(key) {
        if (typeof window === 'undefined') return;

        const value = localStorage.getItem(key);

        if (value) {
            try {
                return JSON.parse(value);
            } catch (err) {
                return value;
            }
        }
        return null;
    }

    static set(key, value) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(value));
    }

    static remove(key) {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(key);
    }

    static clear() {
        if (typeof window === 'undefined') return;
        localStorage.clear();
    }
}
