import type { NavigatorScreenParams } from '@react-navigation/native';

// Routes carry no report content or location. Sensitive data stays in memory, never in params.
export type ReportStackParamList = {
  ReportDescribe: undefined;
  ReportWhen: undefined;
  ReportDetails: undefined;
  ReportReview: undefined;
  ReportSubmitted: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Report: NavigatorScreenParams<ReportStackParamList> | undefined;
  SafetyMap: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Sos: undefined;
};
