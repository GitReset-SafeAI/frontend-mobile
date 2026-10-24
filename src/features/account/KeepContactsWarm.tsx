import { useContacts } from './hooks/useContacts';

// Renders nothing. Mounting a contacts query for as long as someone is signed in keeps their contacts loaded and
// cached, so tapping SOS goes straight to the countdown instead of waiting on a fetch in an emergency.
export function KeepContactsWarm() {
  useContacts();
  return null;
}
