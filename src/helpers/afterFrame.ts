export const afterFrame = <F extends (...ars: any[]) => any>(cb: F) =>
  requestAnimationFrame(() => setTimeout(cb));
