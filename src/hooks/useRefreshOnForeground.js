import { useEffect, useRef } from "react";
import { AppState } from "react-native";

// Calls `onForeground` whenever the app comes back to the foreground after
// being backgrounded - e.g. the user got a notification while the app was
// closed/backgrounded, then reopened it, similar to how Facebook/Instagram
// refresh their feed on reopen. This is separate from (and complements)
// pull-to-refresh and React Navigation's useFocusEffect, which only fires
// on in-app navigation, not on backgrounding/foregrounding.
export function useRefreshOnForeground(onForeground) {
  const appState = useRef(AppState.currentState);
  // Keep the latest callback in a ref so the effect below doesn't need to
  // re-subscribe every time the caller passes a new function reference.
  const callbackRef = useRef(onForeground);
  callbackRef.current = onForeground;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const cameToForeground = appState.current.match(/inactive|background/) && nextState === "active";
      appState.current = nextState;
      if (cameToForeground) {
        callbackRef.current();
      }
    });
    return () => subscription.remove();
  }, []);
}