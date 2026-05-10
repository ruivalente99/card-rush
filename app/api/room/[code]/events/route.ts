import { NextRequest } from 'next/server';
import prisma from '@/lib/db/client';
import { applyAction } from '@/lib/game/engine';
import type { GameState } from '@/lib/game/types';

export const dynamic = 'force-dynamic';

const INACTIVITY_MS = 30_000;

async function autoAdvanceInactive(roomId: string): Promise<void> {
  try {
    await (prisma as any).$transaction(async (tx: typeof prisma) => {
      const room = await (tx as any).room.findUnique({ where: { id: roomId } });
      if (!room || room.phase !== 'PLAYING') return;

      const state: GameState = JSON.parse(room.state);
      const ci = state.currentPlayerIndex;
      const cp = state.players[ci];
      if (!cp || cp.roundState.busted || cp.roundState.stayed || cp.roundState.froze) return;

      const rp = await (tx as any).roomPlayer.findUnique({
        where: { roomId_playerId: { roomId, playerId: cp.id } },
      });
      if (!rp) return;

      const inactive = Date.now() - new Date(rp.lastSeen).getTime() > INACTIVITY_MS;
      if (!inactive) return;

      // Auto-STAY for inactive player (banks current score, advances turn)
      const newState = applyAction(state, { type: 'STAY' });

      const lastEvent = await (tx as any).roomEvent.findFirst({
        where: { roomId },
        orderBy: { seq: 'desc' },
      });
      const seq = (lastEvent?.seq ?? 0) + 1;

      await (tx as any).room.update({
        where: { id: roomId },
        data: { state: JSON.stringify(newState), phase: newState.phase },
      });
      await (tx as any).roomEvent.create({
        data: {
          roomId,
          seq,
          payload: JSON.stringify({ action: { type: 'STAY' }, state: newState }),
        },
      });
    });
  } catch {
    // Swallow — another connection may have raced and already advanced
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const since = parseInt(req.nextUrl.searchParams.get('since') ?? '0', 10);

  const room = await prisma.room.findUnique({ where: { code }, select: { id: true } });
  if (!room) {
    return new Response('Room not found', { status: 404 });
  }

  const roomId = room.id;

  const stream = new ReadableStream({
    async start(controller) {
      let lastSeq = since;
      let closed = false;

      req.signal.addEventListener('abort', () => {
        closed = true;
        controller.close();
      });

      const send = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send current state immediately
      const currentRoom = await prisma.room.findUnique({ where: { id: roomId } });
      if (currentRoom) {
        send(JSON.stringify({ seq: lastSeq, state: JSON.parse(currentRoom.state) }));
      }

      // Poll for new events + check inactivity
      while (!closed) {
        await new Promise((r) => setTimeout(r, 500));
        if (closed) break;

        // Inactivity check every poll cycle
        await autoAdvanceInactive(roomId);

        const events = await prisma.roomEvent.findMany({
          where: { roomId, seq: { gt: lastSeq } },
          orderBy: { seq: 'asc' },
        });

        for (const event of events) {
          if (closed) break;
          const payload = JSON.parse(event.payload);
          send(JSON.stringify({ seq: event.seq, state: payload.state }));
          lastSeq = event.seq;
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
