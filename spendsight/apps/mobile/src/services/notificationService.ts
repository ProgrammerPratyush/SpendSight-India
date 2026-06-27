import apiClient from "./apiClient";

export async function getNotifications() {
    const res = await apiClient.get("/api/notifications");
    return res.data.data;
}

export async function markRead(id: string) {
    return apiClient.patch(`/api/notifications/${id}/read`);
}

export async function markAllRead() {
    const res = await apiClient.patch('/api/notifications/read-all');
    return res.data?.data;
}

export async function getUnreadCount() {
    const res = await apiClient.get(
        "/api/notifications/unread-count"
    );

    return res.data.data.unread;
}
