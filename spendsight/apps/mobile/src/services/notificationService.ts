// src/services/notificationService.ts

import apiClient from './apiClient';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
export interface NotificationItem {
    _id: string;
    title: string;
    body: string;
    type: string;
    severity: string;
    deepLink: string;
    metadata: Record<string, any>;
    readAt: string | null;
    createdAt: string;
}

export interface GetNotificationsResponse {
    notifications: NotificationItem[];
    unreadCount: number;
}

export interface DeviceInfo {
    token: string;
    platform: 'android' | 'ios';
    appVersion: string;
    lastSeen: string;
}

// ═════════════════════════════════════════════════════
// NOTIFICATION API
// ═════════════════════════════════════════════════════

// ── GET all notifications ──
export async function getNotifications(): Promise<GetNotificationsResponse> {
    const res = await apiClient.get('/api/notifications');
    return res.data?.data ?? { notifications: [], unreadCount: 0 };
}

// ── GET unread count (for badge) ──
export async function getUnreadCount(): Promise<number> {
    const res = await apiClient.get('/api/notifications/unread-count');
    return res.data?.data?.count ?? 0;
}

// ── PATCH mark one as read ──
export async function markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/api/notifications/${id}/read`);
}

// ── PATCH mark all as read ──
export async function markAllRead(): Promise<void> {
    await apiClient.patch('/api/notifications/read-all');
}

// ── DELETE one notification ──
export async function deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${id}`);
}

// ── DELETE all notifications ──
export async function clearAllNotifications(): Promise<void> {
    await apiClient.delete('/api/notifications/clear-all');
}

// ═════════════════════════════════════════════════════
// DEVICE MANAGEMENT API
// ═════════════════════════════════════════════════════

// ── POST register device token ──
export async function registerDevice({
    token,
    platform,
    appVersion,
}: {
    token: string;
    platform: 'android' | 'ios';
    appVersion?: string;
}): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post(
        '/api/notifications/register-device',
        {
            token,
            platform,
            appVersion: appVersion ?? '',
        }
    );
    return res.data?.data ?? { success: false, message: 'Unknown error' };
}

// ── POST remove device token ──
export async function removeDevice(token: string): Promise<{
    success: boolean;
    message: string;
}> {
    const res = await apiClient.post(
        '/api/notifications/remove-device',
        { token }
    );
    return res.data?.data ?? { success: false, message: 'Unknown error' };
}

// ── GET all registered devices ──
export async function getDevices(): Promise<{
    devices: DeviceInfo[];
    count: number;
}> {
    const res = await apiClient.get('/api/notifications/devices');
    return res.data?.data ?? { devices: [], count: 0 };
}