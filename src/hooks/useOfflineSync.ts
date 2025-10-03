import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const STORAGE_KEY = 'emergency_pending_operations';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([]);

  useEffect(() => {
    // Load pending operations from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPendingOps(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading pending operations:', error);
      }
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online - syncing data...");
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline - changes will sync when reconnected");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const savePendingOps = (ops: PendingOperation[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    setPendingOps(ops);
  };

  const addPendingOperation = (
    type: 'insert' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    const newOp: PendingOperation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      table,
      data,
      timestamp: Date.now()
    };

    const updated = [...pendingOps, newOp];
    savePendingOps(updated);

    if (isOnline) {
      syncPendingOperations();
    }
  };

  const syncPendingOperations = async () => {
    if (pendingOps.length === 0) return;

    const successIds: string[] = [];

    for (const op of pendingOps) {
      try {
        let result;
        
        switch (op.type) {
          case 'insert':
            result = await (supabase as any).from(op.table).insert(op.data);
            break;
          case 'update':
            result = await (supabase as any).from(op.table).update(op.data).eq('id', op.data.id);
            break;
          case 'delete':
            result = await (supabase as any).from(op.table).delete().eq('id', op.data.id);
            break;
        }

        if (!result.error) {
          successIds.push(op.id);
        }
      } catch (error) {
        console.error('Error syncing operation:', error);
      }
    }

    if (successIds.length > 0) {
      const remaining = pendingOps.filter(op => !successIds.includes(op.id));
      savePendingOps(remaining);
      toast.success(`Synced ${successIds.length} operation(s)`);
    }
  };

  return {
    isOnline,
    pendingCount: pendingOps.length,
    addPendingOperation,
    syncPendingOperations
  };
};
