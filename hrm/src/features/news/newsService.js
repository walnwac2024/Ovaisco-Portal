import api from "../../utils/api";

const API_URL = "/news";

export const listNews = async () => {
    const res = await api.get(API_URL);
    return res.data;
};

export const createNews = async (data) => {
    const res = await api.post(API_URL, data);
    return res.data;
};

export const updateNews = async (id, data) => {
    const res = await api.patch(`${API_URL}/${id}`, data);
    return res.data;
};

export const deleteNews = async (id) => {
    const res = await api.delete(`${API_URL}/${id}`);
    return res.data;
};

export const toggleReaction = async (id, emoji) => {
    const res = await api.post(`${API_URL}/${id}/react`, { emoji });
    return res.data;
};

export const listReactions = async () => {
    const res = await api.get(`${API_URL}/reactions`);
    return res.data;
};
