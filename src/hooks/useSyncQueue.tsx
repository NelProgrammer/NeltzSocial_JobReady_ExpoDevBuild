// src/hooks/useSyncQueue.ts
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { flushSyncQueue } from "../services/SyncService";

/**
 * Hook that watches network connectivity and triggers a flush of the sync queue
 * when the device becomes online.
 */
export const useSyncQueue = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // Attempt to flush any pending sync actions
        void flushSyncQueue();
      }
    });
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);
};
