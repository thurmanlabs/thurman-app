import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AccountContext, User } from "../context/AccountContext";
import { IEmailAuthFormInput } from "../components/EmailAuthForm";
import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:8080";
axios.defaults.withCredentials = true;

export default function AccountProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch current user on mount
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                setLoading(true);
                const response = await axios.get("/api/user/me");
                if (response.data && response.data.success && response.data.user) {
                    setUser(response.data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentUser();
    }, []);

    const signup = async (data: IEmailAuthFormInput) => {
        try {
            setLoading(true);
            console.log("Attempting signup request to:", "/api/auth/signup");
            const response = await axios.post("/api/auth/signup", {
                email: data.emailValue,
                password: data.passwordValue,
                accountType: "SCA",
                blockchains: ["BASE-SEPOLIA"]
            });
            console.log("Signup response:", response.data);
            setUser(response.data.user);
            
            // Navigate to home page after successful signup
            navigate("/");
            
        } catch (error: any) {
            console.error("Signup error:", {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL
                }
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const login = async (data: IEmailAuthFormInput) => {
        try {
            setLoading(true);
            const response = await axios.post("/api/auth/login", {
                email: data.emailValue,
                password: data.passwordValue
            });
            setUser(response.data.user);
            
            // Navigate to home page after successful login
            navigate("/");
            
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await axios.post("/api/auth/logout");
            setUser(null);
            
            // Navigate to home page after successful logout
            navigate("/");
            
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Computed property for admin check
    const isAdmin = user?.role === "ADMIN";

    return (
        <AccountContext.Provider value={{
            user,
            loading,
            isAdmin,
            login,
            signup,
            logout
        }}>
            {children}
        </AccountContext.Provider>
    );
}