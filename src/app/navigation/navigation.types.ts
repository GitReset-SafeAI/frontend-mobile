import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Report: undefined;
  SafetyMap: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
};
