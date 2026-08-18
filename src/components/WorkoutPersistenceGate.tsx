import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/tokens';
import {
  getPersistenceIssueSnapshot,
  subscribePersistenceIssue,
} from '../store/activeSessionPersistence';
import { useWorkoutStore } from '../store/workoutStore';

interface Props {
  children: ReactNode;
}

export function WorkoutPersistenceGate({ children }: Props) {
  const [ready, setReady] = useState(() =>
    useWorkoutStore.persist.hasHydrated(),
  );
  const issue = useSyncExternalStore(
    subscribePersistenceIssue,
    getPersistenceIssueSnapshot,
    getPersistenceIssueSnapshot,
  );
  const lastAlertedIssue = useRef<number | null>(null);

  useEffect(() => {
    if (ready) return;
    let mounted = true;

    void Promise.resolve(useWorkoutStore.persist.rehydrate()).finally(() => {
      if (mounted) setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!issue || lastAlertedIssue.current === issue.id) return;
    lastAlertedIssue.current = issue.id;
    Alert.alert(
      'Couldn’t protect active workout',
      'Your workout is still available in this open app, but its latest changes may not survive closing it. Keep the app open and try another edit.',
    );
  }, [issue]);

  if (!ready) return <View style={styles.loading} />;
  return children;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg },
});
