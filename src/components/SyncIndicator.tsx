// src/components/SyncIndicator.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getSyncStatus, SyncState } from '../services/getSyncStatus';

interface Props {
  resumeId: string;
  size?: number;
}

/**
 * Visual indicator of the sync state for a resume.
 * - synced:   green check
 * - pending:  rotating spinner (orange)
 * - offline:  gray cloud slash
 * - error:    red warning
 */
export const SyncIndicator: React.FC<Props> = ({ resumeId, size = 24 }) => {
  const [state, setState] = useState<SyncState>('offline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      const s = await getSyncStatus(resumeId);
      if (!cancelled) {
        setState(s);
        setLoading(false);
      }
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  if (loading) {
    return <ActivityIndicator size="small" color="#ffc107" />;
  }

  let iconName = 'cloud-off-outline';
  let iconColor = '#9e9e9e';
  switch (state) {
    case 'synced':
      iconName = 'cloud-done-outline';
      iconColor = '#4caf50';
      break;
    case 'pending':
      iconName = 'cloud-upload-outline';
      iconColor = '#ff9800';
      break;
    case 'error':
      iconName = 'error-outline';
      iconColor = '#f44336';
      break;
    case 'offline':
    default:
      iconName = 'cloud-off-outline';
      iconColor = '#9e9e9e';
  }

  return <MaterialIcons name={iconName} size={size} color={iconColor} style={styles.icon} />;
};

const styles = StyleSheet.create({
  icon: {
    marginRight: 8,
  },
});
