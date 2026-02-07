import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [colors, setColors] = useState({ primary: "#E02D3D" }); // Default Red
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem("darkMode");
        return saved === "true" || false;
    });

    const fetchBranding = async () => {
        try {
            const { data } = await api.get("/settings/branding");
            if (data) {
                if (data.colors) setColors(data.colors);
                if (data.logo) setLogo(data.logo);
            }
        } catch (err) {
            console.warn("Failed to fetch branding settings", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const newVal = !prev;
            localStorage.setItem("darkMode", String(newVal));
            return newVal;
        });
    };

    useEffect(() => {
        fetchBranding();
    }, []);

    // Apply Theme Class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [darkMode]);

    // Apply CSS Variables
    useEffect(() => {
        if (colors.primary) {
            const hex = colors.primary.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            document.documentElement.style.setProperty("--color-primary", colors.primary);
            document.documentElement.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);
        }
    }, [colors]);

    return (
        <ThemeContext.Provider value={{ colors, logo, fetchBranding, loading, darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
