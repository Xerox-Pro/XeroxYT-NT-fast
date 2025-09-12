import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { Channel } from '../types';

interface SubscriptionContextType {
  subscribedChannels: Channel[];
  subscribe: (channel: Channel) => void;
  unsubscribe: (channelId: string) => void;
  isSubscribed: (channelId: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Hardcoded default channel that cannot be unsubscribed
const FORCED_SUBSCRIPTION_CHANNEL: Channel = {
    id: 'UCCMV3NfZk_NB-MmUvHj6aFw', // This is AZKi's Channel ID
    name: 'AZKi Channel',
    avatarUrl: 'https://yt3.ggpht.com/b-LyLgA8IAo6PcG52Lg-GkBi1uP5y5vj2_cTR_Q2Yh5Ie94ImALB0m_29z1NO4e8-8yD8a_l=s176-c-k-c0x00ffffff-no-rj-mo',
    subscriberCount: '' // This can be empty as it's not used in the subscription list itself
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscribedChannels, setSubscribedChannels] = useState<Channel[]>(() => {
    try {
      const item = window.localStorage.getItem('subscribedChannels');
      const existingChannels = item ? JSON.parse(item) : [];
      // Ensure the default channel is always present and at the top
      const hasForcedChannel = existingChannels.some((c: Channel) => c.id === FORCED_SUBSCRIPTION_CHANNEL.id);
      if (!hasForcedChannel) {
        return [FORCED_SUBSCRIPTION_CHANNEL, ...existingChannels];
      }
      return [FORCED_SUBSCRIPTION_CHANNEL, ...existingChannels.filter((c: Channel) => c.id !== FORCED_SUBSCRIPTION_CHANNEL.id)];

    } catch (error) {
      console.error(error);
      return [FORCED_SUBSCRIPTION_CHANNEL];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('subscribedChannels', JSON.stringify(subscribedChannels));
    } catch (error) {
      console.error(error);
    }
  }, [subscribedChannels]);

  const subscribe = (channel: Channel) => {
    setSubscribedChannels(prev => {
      if (prev.some(c => c.id === channel.id)) {
        return prev;
      }
      return [...prev, channel];
    });
  };

  const unsubscribe = (channelId: string) => {
    if (channelId === FORCED_SUBSCRIPTION_CHANNEL.id) {
        alert("このチャンネルは登録解除できません。");
        return;
    }
    setSubscribedChannels(prev => prev.filter(c => c.id !== channelId));
  };

  const isSubscribed = (channelId: string) => {
    return subscribedChannels.some(c => c.id === channelId);
  };

  return (
    <SubscriptionContext.Provider value={{ subscribedChannels, subscribe, unsubscribe, isSubscribed }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};