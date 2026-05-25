import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    let socketId, channel;
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await req.json();
      socketId = data.socket_id;
      channel = data.channel_name;
    } else {
      const formData = await req.formData();
      socketId = formData.get('socket_id') as string;
      channel = formData.get('channel_name') as string;
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get('session_id')?.value;

    console.log('Pusher Auth - User ID from cookie:', userId);

    if (!userId) {
      console.log('Pusher Auth - No session_id cookie found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        alias: true,
        profileImage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const presenceData = {
      user_id: user.id,
      user_info: {
        name: user.alias || user.firstName,
        profileImage: user.profileImage,
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
