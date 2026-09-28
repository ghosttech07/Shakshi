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

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, size: number) => void, repeat: [number, number]) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

/** Cotton sateen with box stitching, for a duvet: fine weave, each box puffed, sunken stitch lines. */
export function duvetTexture(repeat = 3) {
  return canvasTexture(
    512,
    (g, s) => {
      g.fillStyle = "#909090";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 2) {
        g.fillStyle = `rgba(255,255,255,${0.03 + Math.random() * 0.05})`;
        g.fillRect(0, i, s, 1);
      }
      const grd = g.createRadialGradient(s / 2, s / 2, s * 0.05, s / 2, s / 2, s * 0.62);
      grd.addColorStop(0, "rgba(255,255,255,0.35)");
      grd.addColorStop(1, "rgba(0,0,0,0.25)");
      g.fillStyle = grd;
      g.fillRect(0, 0, s, s);
      g.strokeStyle = "rgba(0,0,0,0.55)";
      g.lineWidth = 3;
      g.setLineDash([7, 5]);
      g.strokeRect(1.5, 1.5, s - 3, s - 3);
    },
    [repeat, repeat]
  );
}

/** A chunky rib knit, for the throw. */
export function knitTexture(repeat: [number, number] = [14, 4]) {
  return canvasTexture(
    128,
    (g, s) => {
      g.fillStyle = "#6a6a6a";
      g.fillRect(0, 0, s, s);
      // Two columns of V-shaped stitches
      for (let col = 0; col < 2; col++) {
        const x0 = col * (s / 2);
        for (let y = -s / 4; y < s; y += s / 4) {
          const grd = g.createLinearGradient(x0, y, x0 + s / 4, y + s / 4);
          grd.addColorStop(0, "#d8d8d8");
          grd.addColorStop(1, "#8a8a8a");
          g.fillStyle = grd;
          g.beginPath();
          g.ellipse(x0 + s / 8, y + s / 8, s / 11, s / 6.5, -0.55, 0, Math.PI * 2);
          g.fill();
          g.beginPath();
          g.ellipse(x0 + (3 * s) / 8, y + s / 8, s / 11, s / 6.5, 0.55, 0, Math.PI * 2);
          g.fill();
        }
      }
    },
    repeat
  );
}

/** Oak grain, for the bed legs. */
export function woodTexture() {
  return canvasTexture(
    256,
    (g, s) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, s, s);
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * s;
        g.strokeStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},${0.08 + Math.random() * 0.12})`;
        g.lineWidth = 0.6 + Math.random() * 2.2;
        g.beginPath();
        g.moveTo(x, 0);
        g.bezierCurveTo(x + Math.random() * 10 - 5, s * 0.33, x + Math.random() * 10 - 5, s * 0.66, x + Math.random() * 6 - 3, s);
        g.stroke();
      }
    },
    [1, 1]
  );
}
