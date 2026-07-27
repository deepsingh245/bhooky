// A per-uid unique token so two testers in the same emulator don't collide on
// one MockSwiggyMcpClient cart (the mock cart/order maps are keyed by token).
export function mockSwiggyToken(uid: string): string {
  return `mock-swiggy-token:${uid}`;
}
