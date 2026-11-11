import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { env } from '../../../config/env';
import { ApiError } from '../../../services/api/ApiError';
import { emergencyLocation, type LocationFix, type SharedEmergencyLocation } from '../../../services/api/emergencyLocation';
import { openSmsDraft } from '../sms';

const UPDATE_INTERVAL_MS = 10_000;
const SMS_TEXT = 'SOS: I may be in danger. Please contact me immediately. My latest shared location: ';
type ShareError = 'account' | 'configuration' | 'location' | 'network' | 'composer' | 'stop' | 'expired';

function locationFix({ coords }: Location.LocationObject): LocationFix {
  if (coords.accuracy === null || !Number.isFinite(coords.accuracy) || coords.accuracy < 0) {
    throw new Error('Location accuracy is unavailable.');
  }
  return { position: { latitude: coords.latitude, longitude: coords.longitude }, accuracy_m: coords.accuracy };
}

function updateError(error: unknown): ShareError {
  return error instanceof ApiError && error.kind === 'unauthorized' ? 'account' : 'network';
}

export function useEmergencyLocation(userId: string) {
  const [share, setShare] = useState<SharedEmergencyLocation | null>(null);
  const [watching, setWatching] = useState(false);
  const [foreground, setForeground] = useState(() => AppState.currentState == null || AppState.currentState === 'active');
  const [busy, setBusy] = useState(false);
  const [draftOpened, setDraftOpened] = useState(false);
  const [error, setError] = useState<ShareError | null>(null);
  const mounted = useRef(false);
  const pending = useRef(false);
  const updating = useRef(false);
  const lastUpdate = useRef(0);
  const active = useRef<SharedEmergencyLocation | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const current = active.current;
      active.current = null;
      if (current) void emergencyLocation.end(userId, current.share_id).catch(() => undefined);
    };
  }, [userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { setForeground(state === 'active'); });
    return () => { subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!share) return;
    const timer = setTimeout(() => {
      active.current = null;
      setShare(null);
      setWatching(false);
      setError('expired');
    }, Math.max(0, Date.parse(share.expires_at) - Date.now()));
    return () => { clearTimeout(timer); };
  }, [share]);

  useEffect(() => {
    if (!share || !watching || !foreground) return;
    let subscription: Location.LocationSubscription | undefined;
    let live = true;
    const reportLocationError = () => {
      if (live) setError('location');
    };
    const options = { accuracy: Location.Accuracy.High, timeInterval: UPDATE_INTERVAL_MS };

    void Location.watchPositionAsync(options, (position) => {
      const now = Date.now();
      if (!live || updating.current || active.current !== share || now >= Date.parse(share.expires_at)
        || now - lastUpdate.current < UPDATE_INTERVAL_MS) return;
      let fix: LocationFix;
      try { fix = locationFix(position); }
      catch { reportLocationError(); return; }
      lastUpdate.current = now;
      updating.current = true;
      void emergencyLocation.update(userId, share.share_id, fix).then(() => {
        if (live) setError((current) => current === 'network' || current === 'location' ? null : current);
      }).catch((failure: unknown) => {
        if (live) setError(updateError(failure));
      }).finally(() => { updating.current = false; });
    }, reportLocationError).then((watch) => {
      if (live) subscription = watch;
      else watch.remove();
    }).catch(reportLocationError);

    return () => { live = false; subscription?.remove(); };
  }, [foreground, share, userId, watching]);

  const messageFor = (current: SharedEmergencyLocation) =>
    SMS_TEXT + new URL('/track/' + encodeURIComponent(current.share_id), env.publicAppUrl).href;

  const openDraft = async (phone: string, current: SharedEmergencyLocation) => {
    if (active.current !== current || Date.now() >= Date.parse(current.expires_at)) return;
    try {
      await openSmsDraft(phone, messageFor(current));
      if (active.current !== current) return;
      setDraftOpened(true);
      setError((previous) => previous === 'composer' ? null : previous);
    } catch {
      if (active.current === current) setError('composer');
    }
  };

  const send = async (phone: string) => {
    if (pending.current || active.current) return;
    if (env.authMode !== 'supabase') { setError('account'); return; }
    if (!env.apiBaseUrl || !env.publicAppUrl) { setError('configuration'); return; }
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      let fix: LocationFix;
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) throw new Error('Location permission was denied.');
        if (!mounted.current) return;
        fix = locationFix(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }));
      } catch {
        if (mounted.current) setError('location');
        return;
      }
      if (!mounted.current) return;
      const created = await emergencyLocation.start(userId, fix);
      if (!mounted.current) {
        void emergencyLocation.end(userId, created.share_id).catch(() => undefined);
        return;
      }
      active.current = created;
      lastUpdate.current = Date.now();
      setShare(created);
      setDraftOpened(false);
      setWatching(true);
      await openDraft(phone, created);
    } catch (failure) {
      if (mounted.current) setError(updateError(failure));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const stop = async () => {
    const current = active.current;
    if (!current || pending.current) return;
    pending.current = true;
    setBusy(true);
    setWatching(false);
    try {
      await emergencyLocation.end(userId, current.share_id);
      if (active.current !== current) return;
      active.current = null;
      setShare(null);
      setError(null);
    } catch {
      if (active.current === current) setError('stop');
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return {
    busy, share, draftOpened, error, send, stop,
    message: share ? messageFor(share) : null,
    reopen: (phone: string) => { if (active.current) void openDraft(phone, active.current); },
  };
}
