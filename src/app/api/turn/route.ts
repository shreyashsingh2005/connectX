import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.TURN_URL;
  const username = process.env.TURN_USERNAME;
  const credential = process.env.TURN_CREDENTIAL;

  const iceServers: any[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (url && username && credential) {
    iceServers.push({
      urls: url,
      username,
      credential
    });
  }

  return NextResponse.json({ iceServers });
}
