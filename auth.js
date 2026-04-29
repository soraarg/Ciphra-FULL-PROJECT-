// Ciphra Auth Helper
window.API_BASE = window.API_BASE || ''; // Rutas relativas para evitar errores de puerto

const Auth = {
    login: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('ciphra_token', data.token);
                localStorage.setItem('ciphra_user', JSON.stringify(data.user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    register: async (email, password) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('ciphra_token', data.token);
                localStorage.setItem('ciphra_user', JSON.stringify(data.user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    googleLogin: async (email, name) => {
        try {
            const response = await fetch(`${API_BASE}/api/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('ciphra_token', data.token);
                localStorage.setItem('ciphra_user', JSON.stringify(data.user));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Error de conexión con el servidor.' };
        }
    },

    logout: () => {
        localStorage.removeItem('ciphra_token');
        localStorage.removeItem('ciphra_user');
        window.location.href = 'login.html';
    },

    check: async () => {
        const token = localStorage.getItem('ciphra_token');
        if (!token) return false;

        try {
            const response = await fetch(`${API_BASE}/api/auth/check`, {
                headers: { 'Authorization': token }
            });
            const data = await response.json();
            return data.authenticated;
        } catch (err) {
            return false;
        }
    },

    getUser: () => {
        const user = localStorage.getItem('ciphra_user');
        return user ? JSON.parse(user) : null;
    },

    guard: async () => {
        const isAuth = await Auth.check();
        if (!isAuth) {
            window.location.href = 'login.html';
        }
    }
};
