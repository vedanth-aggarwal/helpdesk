export function withResetOnClose(onOpenChange: (open: boolean) => void, reset: () => void) {
  return (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };
}
