import { useState, useCallback, useEffect } from "react";
import api from "../../../utils/api";
import { toast } from "react-toastify";

export default function useTimeline(employeeId) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: "",
        startDate: "",
        endDate: "",
        search: ""
    });

    const fetchTimeline = useCallback(async () => {
        if (!employeeId) return;
        try {
            setLoading(true);
            setError(null);
            const { data } = await api.get(`/employees/${employeeId}/timeline`, { params: filters });
            setEvents(data);
        } catch (err) {
            console.error("fetchTimeline Error:", err);
            setError("Failed to load timeline events");
            toast.error("Failed to load timeline");
        } finally {
            setLoading(false);
        }
    }, [employeeId, filters]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const addEvent = async (eventData) => {
        try {
            setLoading(true);
            await api.post(`/employees/${employeeId}/timeline`, eventData);
            toast.success("Event added successfully");
            fetchTimeline();
            return true;
        } catch (err) {
            console.error("addEvent Error:", err);
            toast.error(err.response?.data?.message || "Failed to add event");
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            category: "",
            startDate: "",
            endDate: "",
            search: ""
        });
    };

    return {
        events,
        loading,
        error,
        filters,
        updateFilter,
        resetFilters,
        refetch: fetchTimeline,
        addEvent
    };
}
