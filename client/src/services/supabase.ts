import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wemjefizjcbjvtplllxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbWplZml6amNianZ0cGxsbHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDA1MDUsImV4cCI6MjA5NzI3NjUwNX0.jYyiWGUgJ61ztwqDWoUjR5GAHZJ0TwPHkcA_lXhAWuM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscription types
export type SubscriptionCallback<T extends Record<string, any> = Record<string, any>> = (payload: any) => void;

// Active subscriptions map
const subscriptions = new Map<string, RealtimeChannel>();

// Helper to create a subscription
export const subscribeToTable = <T extends Record<string, any> = Record<string, any>>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: SubscriptionCallback<T>,
  filter?: string
): RealtimeChannel => {
  const channelName = `${table}_${event}_${Date.now()}`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        filter
      },
      callback
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to ${table} (${event})`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Subscription error for ${table}`);
      }
    });

  subscriptions.set(channelName, channel);
  return channel;
};

// Unsubscribe from a specific channel
export const unsubscribe = (channelName: string) => {
  const channel = subscriptions.get(channelName);
  if (channel) {
    supabase.removeChannel(channel);
    subscriptions.delete(channelName);
    console.log(`🔌 Unsubscribed from ${channelName}`);
  }
};

// Unsubscribe from all channels
export const unsubscribeAll = () => {
  subscriptions.forEach((channel, name) => {
    supabase.removeChannel(channel);
    console.log(`🔌 Unsubscribed from ${name}`);
  });
  subscriptions.clear();
};

// Specific subscription helpers
export const subscribeToDestinations = (callback: SubscriptionCallback) => {
  return subscribeToTable('destinations', '*', callback);
};

export const subscribeToEvents = (callback: SubscriptionCallback) => {
  return subscribeToTable('events', '*', callback);
};

export const subscribeToAccommodations = (callback: SubscriptionCallback) => {
  return subscribeToTable('accommodations', '*', callback);
};

export const subscribeToGuides = (callback: SubscriptionCallback) => {
  return subscribeToTable('guides', '*', callback);
};

export const subscribeToGettingThere = (callback: SubscriptionCallback) => {
  return subscribeToTable('getting_there', '*', callback);
};

export const subscribeToItineraryRequests = (callback: SubscriptionCallback) => {
  return subscribeToTable('itinerary_requests', '*', callback);
};
