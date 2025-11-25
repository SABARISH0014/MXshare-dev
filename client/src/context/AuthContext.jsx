import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1. Initialize State
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(localStorage.getItem('userToken') || null);
    const [loading, setLoading] = useState(true);

    // 2. Load User on Mount
    useEffect(() => {
        const loadUser = async () => {
            if (authToken) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                const storedUser = localStorage.getItem('userData');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [authToken]);

    // 3. Login Action
    const login = (token, userData) => {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setAuthToken(token);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    // 4. Logout Action
    // Inside AuthContext.js

const logout = () => {
    console.log("Logging out and clearing all tokens...");

    // 1. Remove App specific tokens
    localStorage.removeItem('userToken'); // The key used in your previous login logic
    localStorage.removeItem('authToken'); // The key you mentioned in the prompt
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');

    // 2. Remove Google specific tokens
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleRefreshToken');

    // 3. Reset React State
    setAuthToken(null);
    setUser(null);
    
    // 4. Clear Axios Header
    delete axios.defaults.headers.common['Authorization'];
};

    // 5. The Provider (PASSING LOGOUT HERE IS KEY)
    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            authToken, 
            login, 
            logout, // <--- ✅ THIS MUST BE HERE
            loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};