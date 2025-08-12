// Utility to toggle visibility of in-game DOM UI from any scene
export function setInGameUIVisible(visible) {
  const controls = document.querySelector('.controls');
  const header = document.querySelector('.game-header');
  const pathInfo = document.getElementById('pathInfo');
  const method = visible ? 'remove' : 'add';
  if (controls) controls.classList[method]('hidden');
  if (header) header.classList[method]('hidden');
  if (pathInfo) pathInfo.classList[method]('hidden');
}
