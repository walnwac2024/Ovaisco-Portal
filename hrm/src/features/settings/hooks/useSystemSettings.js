// Custom hook for managing system settings (dropdowns)
import { useState, useEffect, useCallback } from "react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

export default function useSystemSettings(type) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all items for a specific type
    const fetchSettings = useCallback(async (activeOnly = false) => {
        if (!type) return;

        setLoading(true);
        setError(null);

        try {
            const params = activeOnly ? { active_only: "1" } : {};
            const response = await api.get(`/settings/${type}`, { params });
            setData(response.data || []);
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
            setError(err.response?.data?.message || "Failed to load data");
            toast.error(err.response?.data?.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [type]);

    // Create new item
    const createItem = async (itemData) => {
        try {
            const response = await api.post(`/settings/${type}`, itemData);
            toast.success(response.data?.message || "Created successfully");
            await fetchSettings(); // Refresh list
            return { success: true, data: response.data };
        } catch (err) {
            console.error(`Error creating ${type}:`, err);
            const message = err.response?.data?.message || "Failed to create";
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Update existing item
    const updateItem = async (id, itemData) => {
        try {
            const response = await api.patch(`/settings/${type}/${id}`, itemData);
            toast.success(response.data?.message || "Updated successfully");
            await fetchSettings(); // Refresh list
            return { success: true, data: response.data };
        } catch (err) {
            console.error(`Error updating ${type}:`, err);
            const message = err.response?.data?.message || "Failed to update";
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Delete item (soft delete)
    const deleteItem = async (id) => {
        try {
            const response = await api.delete(`/settings/${type}/${id}`);
            toast.success(response.data?.message || "Deleted successfully");
            await fetchSettings(); // Refresh list
            return { success: true };
        } catch (err) {
            console.error(`Error deleting ${type}:`, err);
            const message = err.response?.data?.message || "Failed to delete";
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Toggle active status
    const toggleActive = async (id, currentStatus) => {
        return await updateItem(id, { is_active: currentStatus ? 0 : 1 });
    };

    // Initial fetch
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        data,
        loading,
        error,
        refresh: fetchSettings,
        createItem,
        updateItem,
        deleteItem,
        toggleActive,
    };
}
