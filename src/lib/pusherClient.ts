import PusherClient from 'pusher-js';

export const pusherClient = typeof window !== 'undefined' 
  ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || 'dummy_key', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: '/api/pusher/auth',
      authTransport: 'ajax',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    })
  : null as any;
