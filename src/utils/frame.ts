export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function delayFrames(frames: number = 1): Promise<void> {
  return new Promise((resolve) => {
    let count = 0;
    function tick() {
      count++;
      if (count >= frames) resolve();
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
