import { useEffect, useState } from "react";
import { callSessionStatus } from "../lib/apiClient.js";

interface SwiggySessionState {
  connected: boolean;
  loading: boolean;
}

export function useSwiggySession(refreshKey: number): SwiggySessionState {
  const [state, setState] = useState<SwiggySessionState>({ connected: false, loading: true });

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    callSessionStatus()
      .then((status) => {
        if (!cancelled) setState({ connected: status.connected, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ connected: false, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return state;
}
