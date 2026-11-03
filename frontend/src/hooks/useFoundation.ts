import { useCallback, useEffect, useRef, useState } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

type Status = 'connecting' | 'online' | 'offline';

type HealthResponse = { status: string; app: string; phase: number; utc: string };
type DatabaseResponse = { status: string; database: string };
type SimulationResponse = {
  status: string;
  ticks: number;
  intervalMs: number;
  note: string;
};
type PongResponse = { message: string; serverTimeUtc: string };

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export function useFoundation() {
  const [api, setApi] = useState<Status>('connecting');
  const [database, setDatabase] = useState<Status>('connecting');
  const [realtime, setRealtime] = useState<Status>('connecting');
  const [ticks, setTicks] = useState<number>(0);
  const [pong, setPong] = useState<string>('Chưa gửi tín hiệu thử nghiệm');
  const hubRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const check = async () => {
      try {
        const result = await fetchJson<HealthResponse>('/api/health', controller.signal);
        if (active) setApi(result.status === 'ok' ? 'online' : 'offline');
      } catch {
        if (active) setApi('offline');
      }

      try {
        const result = await fetchJson<DatabaseResponse>('/api/health/db', controller.signal);
        if (active) setDatabase(result.status === 'ok' ? 'online' : 'offline');
      } catch {
        if (active) setDatabase('offline');
      }
    };

    const checkTicks = async () => {
      try {
        const result = await fetchJson<SimulationResponse>('/api/simulation/status', controller.signal);
        if (active) setTicks(result.ticks);
      } catch {
        // The API status is already shown separately.
      }
    };

    void check();
    void checkTicks();
    const timer = window.setInterval(() => {
      void check();
      void checkTicks();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/foundation')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.onreconnecting(() => {
      hubRef.current = null;
      if (!disposed) setRealtime('connecting');
    });
    connection.onreconnected(() => {
      hubRef.current = connection;
      if (!disposed) setRealtime('online');
    });
    connection.onclose(() => {
      hubRef.current = null;
      if (!disposed) setRealtime('offline');
    });

    void connection.start()
      .then(async () => {
        if (disposed) {
          await connection.stop();
          return;
        }
        hubRef.current = connection;
        setRealtime('online');
      })
      .catch(() => {
        if (!disposed) setRealtime('offline');
      });

    return () => {
      disposed = true;
      hubRef.current = null;
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop();
      }
    };
  }, []);

  const ping = useCallback(async () => {
    const connection = hubRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      setPong('SignalR chưa kết nối.');
      return;
    }
    try {
      const response = await connection.invoke<PongResponse>('Ping', 'Ping từ giao diện PixiJS + React');
      setPong(`Pong ✓ · ${new Date(response.serverTimeUtc).toLocaleTimeString('vi-VN')}`);
    } catch {
      setPong('Không gửi được Ping tới server.');
    }
  }, []);

  return { api, database, realtime, ticks, pong, ping };
}
