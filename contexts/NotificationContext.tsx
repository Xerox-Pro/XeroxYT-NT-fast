
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useSubscription } from './SubscriptionContext';
import type { Notification } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.API_KEY;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { subscribedChannels } = useSubscription();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        try {
            const storedNotifications = localStorage.getItem('notifications');
            if (storedNotifications) {
                setNotifications(JSON.parse(storedNotifications));
            }
        } catch (error) {
            console.error("Failed to load notifications from localStorage", error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!API_KEY || subscribedChannels.length === 0 || isLoading) {
            return;
        }
        setIsLoading(true);

        const lastCheckStr = localStorage.getItem('lastNotificationCheck');
        const lastCheckDate = lastCheckStr ? new Date(lastCheckStr) : null;
        const channelMap = new Map(subscribedChannels.map(c => [c.id, c]));
        
        const requests = subscribedChannels.map(channel => {
            const url = `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${channel.id}&maxResults=1&order=date&type=video&key=${API_KEY}`;
            return fetch(url).then(res => res.json());
        });

        try {
            const results = await Promise.allSettled(requests);
            const newNotifications: Notification[] = [];

            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value.items?.length > 0) {
                    const item = result.value.items[0];
                    const publishedAt = item.snippet.publishedAt;

                    if (!lastCheckDate || new Date(publishedAt) > lastCheckDate) {
                        const channel = channelMap.get(item.snippet.channelId);
                        if (channel) {
                            newNotifications.push({
                                id: item.id.videoId,
                                channel: {
                                    id: channel.id,
                                    name: channel.name,
                                    avatarUrl: channel.avatarUrl,
                                },
                                video: {
                                    id: item.id.videoId,
                                    title: item.snippet.title,
                                    thumbnailUrl: item.snippet.thumbnails.high.url,
                                },
                                publishedAt: publishedAt,
                            });
                        }
                    }
                }
            });

            if (newNotifications.length > 0) {
                newNotifications.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                setNotifications(prev => {
                    const combined = [...newNotifications, ...prev];
                    const uniqueNotifications = Array.from(new Map(combined.map(item => [item.id, item])).values());
                    const sorted = uniqueNotifications.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                    const finalNotifications = sorted.slice(0, 30);
                    localStorage.setItem('notifications', JSON.stringify(finalNotifications));
                    return finalNotifications;
                });
                setUnreadCount(prev => prev + newNotifications.length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [subscribedChannels, isLoading]);

    useEffect(() => {
        // Fetch on initial load and when subscriptions change
        fetchNotifications();
    }, [subscribedChannels]); // eslint-disable-line react-hooks/exhaustive-deps

    const markAsRead = useCallback(() => {
        setUnreadCount(0);
        localStorage.setItem('lastNotificationCheck', new Date().toISOString());
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isLoading, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
