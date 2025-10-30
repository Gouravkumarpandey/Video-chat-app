import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

const API_BASE_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on app start
        console.log('AuthProvider initializing...');
        const token = localStorage.getItem('authToken');
        console.log('Found token:', token ? 'Yes' : 'No');
        if (token) {
            // Verify token with backend
            verifyToken(token);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (token) => {
        try {
            console.log('Verifying token...');
            const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('Token verified, user data:', userData);
                setUser(userData);
            } else {
                console.log('Token verification failed, removing token');
                // Token is invalid, remove it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            console.log('Attempting login with:', email);
            // Create payload with proper format
            const payload = { email, password };
            console.log('Login request payload:', { ...payload, password: '***' });
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Login response status:', response.status);
            
            // Handle non-JSON responses
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                data = { error: 'Server returned non-JSON response' };
            }
            
            console.log('Login response data:', data);

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                console.log('Login successful, user set:', data.user);
                return { success: true };
            } else {
                console.log('Login failed:', data.error);
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (userData) => {
        setIsLoading(true);
        try {
            // Extract firstName and lastName from name if provided as a combined field
            let firstName, lastName;
            if (userData.name && !userData.firstName) {
                const nameParts = userData.name.split(' ');
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ');
            } else {
                firstName = userData.firstName;
                lastName = userData.lastName;
            }
            
            // Ensure firstName and lastName are sent as separate fields
            const payload = {
                firstName: firstName,
                lastName: lastName,
                email: userData.email,
                password: userData.password
            };
            console.log('Signup payload:', { ...payload, password: '***' });
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            
            console.log('Signup response status:', response.status);
            
            // Handle non-JSON responses
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.log('Non-JSON response:', text);
                data = { error: 'Server returned non-JSON response' };
            }
            
            console.log('Signup response data:', data);

            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Signup failed' };
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;