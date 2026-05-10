import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import { applyAction } from '@/lib/game/engine';
import type { GameAction, GameState } from '@/lib/game/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { playerId, action }: { playerId: string; action: GameAction } = await req.json();

  // Wrap entire read-modify-write in a serializable transaction to prevent race conditions
  const result = await (prisma as any).$transaction(async (tx: typeof prisma) => {
    const room = await tx.room.findUnique({ where: { code } });
    if (!room) return { error: 'Not found', status: 404 };

    const state: GameState = JSON.parse(room.state);

    if (state.phase === 'PLAYING') {
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer?.id !== playerId) {
        return { error: 'Not your turn', status: 403 };
      }
    }

    let newState = applyAction(state, action);

    // Engine doesn't auto-advance after bust; server does it so online games progress
    if (action.type === 'DRAW' && newState.phase === 'PLAYING') {
      const prevBusted = new Set(state.players.filter((p) => p.roundState.busted).map((p) => p.id));
      const justBusted = newState.players.find((p) => p.roundState.busted && !prevBusted.has(p.id));
      if (justBusted) {
        newState = applyAction(newState, { type: 'NEXT_TURN' });
      }
    }

    const lastEvent = await tx.roomEvent.findFirst({
      where: { roomId: room.id },
      orderBy: { seq: 'desc' },
    });
    const seq = (lastEvent?.seq ?? 0) + 1;

    await tx.room.update({
      where: { code },
      data: { state: JSON.stringify(newState), phase: newState.phase },
    });

    await tx.roomEvent.create({
      data: {
        roomId: room.id,
        seq,
        payload: JSON.stringify({ action, state: newState }),
      },
    });

    return { state: newState, seq };
  });

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status as number });
  }

  return NextResponse.json({ state: result.state, seq: result.seq });
}
