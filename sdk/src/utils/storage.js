class Storage {
    /**
     * Get item from localStorage
     */
    static get(key) {
        try {
            const item = localStorage.getItem(`behaveiq_${key}`);
            if (!item) return null;

            const parsed = JSON.parse(item);

            // Check expiration
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(`behaveiq_${key}`);
                return null;
            }

            return parsed.value;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    }

    /**
     * Set item in localStorage with expiration (in minutes)
     */
    static set(key, value, expiryMinutes = null) {
        try {
            const item = {
                value,
                expiry: expiryMinutes ? Date.now() + (expiryMinutes * 60 * 1000) : null
            };

            localStorage.setItem(`behaveiq_${key}`, JSON.stringify(item));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    }

    /**
     * Remove item from localStorage
     */
    static remove(key) {
        try {
            localStorage.removeItem(`behaveiq_${key}`);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    }

    /**
     * Clear all BEHAVEIQ data
     */
    static clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('behaveiq_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
}

export default Storage;