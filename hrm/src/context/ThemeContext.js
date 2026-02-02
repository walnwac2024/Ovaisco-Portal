import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [colors, setColors] = useState({ primary: "#E02D3D" }); // Default Red
    const [logo, setLogo] = useState(null);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchBranding();
    }, []);

    // Apply CSS Variables
    useEffect(() => {
        if (colors.primary) {
            // Convert hex to RGB for Tailwind opacity support
            const hex = colors.primary.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            document.documentElement.style.setProperty("--color-primary", colors.primary);
            document.documentElement.style.setProperty("--color-primary-rgb", `${r} ${g} ${b}`);
        }
    }, [colors]);

    return (
        <ThemeContext.Provider value={{ colors, logo, fetchBranding, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
