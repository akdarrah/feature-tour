// Device frames. Each returns { root, screen, setAddress?, setTime?, fit }.
// Content is rendered into `screen`. Phone and tablet bodies keep their real
// pixel size and are scaled down with a transform to fit the stage.

import { h } from './dom.js';

export function browserFrame(addressText) {
  const address = h('div', { class: 'tf-address' }, addressText || '');
  const screen = h('div', { class: 'tf-browser-screen' });
  const root = h(
    'div',
    { class: 'tf-browser' },
    h('div', { class: 'tf-browser-bar' }, h('span', { class: 'tf-dots' }, h('i'), h('i'), h('i')), address),
    screen,
  );
  return {
    root,
    screen,
    setAddress(text) {
      address.textContent = text;
    },
    setTime() {},
    fit() {},
  };
}

function scaledDevice(kind, width, height) {
  const time = h('span', { class: 'tf-status-time' });
  const screen = h('div', { class: 'tf-device-screen' });
  const body = h(
    'div',
    { class: `tf-device tf-${kind}`, style: { width: `${width}px`, height: `${height}px` } },
    h('div', { class: 'tf-status' }, time, h('span', { class: 'tf-status-icons' }, '▂▄▆ ◔')),
    screen,
  );
  const root = h('div', { class: 'tf-device-holder' }, body);

  function fit() {
    const box = root.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const scale = Math.min(1, (box.width - 24) / width, (box.height - 24) / height);
    body.style.transform = `scale(${scale})`;
  }

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(root);

  return {
    root,
    screen,
    setAddress() {},
    setTime(text) {
      time.textContent = text;
    },
    fit,
  };
}

export function phoneFrame() {
  return scaledDevice('phone', 390, 844);
}

export function tabletFrame() {
  return scaledDevice('tablet', 1180, 820);
}
