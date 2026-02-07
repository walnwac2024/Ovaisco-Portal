import { useEffect, useCallback } from 'react';
import api from '../utils/api';

const VAPID_PUBLIC_KEY = 'BL9O_frMgJURQByq4IWakBcY9Xd1PVFPuOQqxktpwpEUXQhlv0JReNG34TRhXxxkVuNOnpDaHm7VmOvksf_5dIU';

export function usePushNotifications(user) {
    const subscribeUser = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Check for existing subscription
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                // Already subscribed, send to backend just in case
                await api.post('/push/subscribe', { subscription: existingSubscription });
                return;
            }

            // Request permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('Push notification permission denied');
                return;
            }

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send to backend
            await api.post('/push/subscribe', { subscription });
            console.log('Push subscription successful');
        } catch (err) {
            console.error('Failed to subscribe to push notifications:', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            // Delay slightly to not interrupt initial load
            const timer = setTimeout(() => {
                subscribeUser();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [user, subscribeUser]);

    return { subscribeUser };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
