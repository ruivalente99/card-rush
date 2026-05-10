import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { generateRoomCode } from '@/lib/room';
import { createInitialState } from '@/lib/game/engine';
import type { GameConfig } from '@/lib/game/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { hostId, hostName, pointTarget = 200, maxRounds, turnTimerSeconds = 0, gameMode = 'free' } = body;

  if (!hostId || !hostName) {
    return NextResponse.json({ error: 'hostId and hostName required' }, { status: 400 });
  }

  const code = generateRoomCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 hours

  const config: GameConfig = {
    pointTarget,
    maxRounds,
    turnTimerSeconds,
    gameMode,
    players: [{ id: hostId, name: hostName }],
  };

  const initialState = createInitialState(config);

  const room = await prisma.room.create({
    data: {
      code,
      hostId,
      state: JSON.stringify(initialState),
      phase: 'LOBBY',
      expiresAt,
      players: {
        create: { playerId: hostId, name: hostName },
      },
    },
  });

  return NextResponse.json({ roomId: room.id, code });
}
