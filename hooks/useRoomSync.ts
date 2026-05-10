'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/lib/game/types';

export function useRoomSync(code: string | null) {
  const { setOnlineGame, lastSeq, setLastSeq, playerId, setPlayerId, setRoomCode, setUI } = useGameStore();
  const esRef = useRef<EventSource | null>(null);
  const seqRef = useRef(lastSeq);

  useEffect(() => {
    seqRef.current = lastSeq;
  }, [lastSeq]);

  // Restore session from sessionStorage on mount if store lost state (e.g. hard reload)
  useEffect(() => {
    if (!playerId && typeof sessionStorage !== 'undefined') {
      const savedId = sessionStorage.getItem('flip7:playerId');
      const savedCode = sessionStorage.getItem('flip7:roomCode');
      if (savedId) setPlayerId(savedId);
      if (savedCode) setRoomCode(savedCode);
    }
  }, []);

  useEffect(() => {
    if (!code) return;

    const connect = () => {
      const es = new EventSource(
        `/api/room/${code}/events?since=${seqRef.current}`
      );
      esRef.current = es;

      es.onmessage = (e) => {
        const data = JSON.parse(e.data) as { seq: number; state: GameState };
        seqRef.current = data.seq;
        setLastSeq(data.seq);
        setOnlineGame(data.state);
      };

      es.onerror = () => {
        es.close();
        setTimeout(connect, 2000);
      };
    };

    connect();

    // Fetch initial state in case SSE is slow to connect (also serves as rejoin)
    fetch(`/api/room/${code}/state`)
      .then((r) => r.json())
      .then((data) => {
        if (data.state) setOnlineGame(data.state);
      })
      .catch(() => {});

    const heartbeat = setInterval(() => {
      const pid = useGameStore.getState().playerId;
      if (!pid) return;
      const t0 = Date.now();
      fetch(`/api/room/${code}/join`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: pid }),
      })
        .then(() => setUI({ ping: Date.now() - t0 }))
        .catch(() => setUI({ ping: null }));
    }, 10_000);

    return () => {
      esRef.current?.close();
      clearInterval(heartbeat);
    };
  }, [code]);
}
