import * as THREE from "three";

/** A fine woven-linen bump texture, drawn once on a canvas. */
export function linenTexture(repeat = 6) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 2) {
    g.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.08})`;
    g.fillRect(0, i, size, 1);
    g.fillStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.07})`;
    g.fillRect(i, 0, 1, size);
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.06)`;
    g.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 3, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

/** A diamond-quilted bump texture for mattress tops. */
export function quiltTexture(repeat = 4) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 1.4);
  grd.addColorStop(0, "#9a9a9a");
  grd.addColorStop(1, "#6a6a6a");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "#3a3a3a";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, size / 2);
  g.lineTo(size / 2, 0);
  g.lineTo(size, size / 2);
  g.lineTo(size / 2, size);
  g.closePath();
  g.stroke();
  g.fillStyle = "#2a2a2a";
  [[size / 2, size / 2], [0, 0], [size, 0], [0, size], [size, size]].forEach(([x, y]) => {
    g.beginPath();
    g.arc(x, y, 5, 0, Math.PI * 2);
    g.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}
