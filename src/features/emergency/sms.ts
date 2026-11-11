import { Linking, Platform } from 'react-native';

export function openSmsDraft(phone: string, message: string) {
  const separator = Platform.OS === 'ios' ? '&' : '?';
  return Linking.openURL(`sms:${phone}${separator}body=${encodeURIComponent(message)}`);
}
