import { focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState } from 'react-native';

export function subscribeQueryLifecycle(): () => void {
  focusManager.setFocused(AppState.currentState === 'active');
  const appSubscription = AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
  let active = true;
  let receivedEvent = false;
  const applyNetworkState = (state: Network.NetworkState) => {
    onlineManager.setOnline(state.isInternetReachable ?? state.isConnected ?? true);
  };
  const networkSubscription = Network.addNetworkStateListener((state) => {
    receivedEvent = true;
    applyNetworkState(state);
  });
  void Network.getNetworkStateAsync().then((state) => {
    if (active && !receivedEvent) applyNetworkState(state);
  }).catch(() => { /* Unknown connectivity: allow explicit requests. */ });

  return () => {
    active = false;
    appSubscription.remove();
    networkSubscription.remove();
  };
}
