import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import type { GameState } from '@/lib/game/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, playerName, playerEmoji } = await req.json();

  if (!playerId || !playerName) {
    return NextResponse.json({ error: 'playerId and playerName required' }, { status: 400 });
  }

  const room = await prisma.room.findUnique({ where: { code } });
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.phase !== 'LOBBY') {
    return NextResponse.json({ error: 'Game already started' }, { status: 409 });
  }

  const state: GameState = JSON.parse(room.state);

  // Check if player already in room
  const existing = state.config.players.find((p) => p.id === playerId);
  if (!existing) {
    state.config.players.push({ id: playerId, name: playerName, emoji: playerEmoji });

    await prisma.$transaction([
      prisma.room.update({
        where: { code },
        data: { state: JSON.stringify(state) },
      }),
      prisma.roomPlayer.upsert({
        where: { roomId_playerId: { roomId: room.id, playerId } },
        update: { connected: true, name: playerName },
        create: { roomId: room.id, playerId, name: playerName },
      }),
    ]);
  } else {
    // Rejoin: mark connected
    await prisma.roomPlayer.update({
      where: { roomId_playerId: { roomId: room.id, playerId } },
      data: { connected: true },
    });
  }

  return NextResponse.json({ roomId: room.id, state });
}

// Heartbeat
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId } = await req.json();

  const room = await prisma.room.findUnique({ where: { code }, select: { id: true } });
  if (!room) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.roomPlayer.updateMany({
    where: { roomId: room.id, playerId },
    data: { connected: true },
  });

  return NextResponse.json({ ok: true });
}
