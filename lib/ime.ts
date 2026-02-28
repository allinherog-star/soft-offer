import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export function isImeComposing(event: ReactKeyboardEvent<HTMLElement>): boolean {
  const nativeEvent = event.nativeEvent as KeyboardEvent & { keyCode?: number };

  return (
    event.isComposing ||
    nativeEvent.isComposing ||
    event.keyCode === 229 ||
    nativeEvent.keyCode === 229
  );
}
