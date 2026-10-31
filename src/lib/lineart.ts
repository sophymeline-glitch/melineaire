// Generated starter illustration (a blooming mandala) until admin artwork is uploaded.
export function mandalaSvg(size = 800) {
  const c = size / 2;
  const parts: string[] = [];
  const ring = (n: number, r: number, rx: number, ry: number, off = 0) => {
    for (let i = 0; i < n; i++) {
      const a = (360 / n) * i + off;
      parts.push(
        `<ellipse cx="${c}" cy="${c - r}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${c} ${c})"/>`,
      );
    }
  };
  parts.push(`<circle cx="${c}" cy="${c}" r="${size * 0.47}"/>`);
  ring(16, size * 0.36, size * 0.05, size * 0.1, 11.25);
  ring(12, size * 0.25, size * 0.06, size * 0.11);
  parts.push(`<circle cx="${c}" cy="${c}" r="${size * 0.15}"/>`);
  ring(8, size * 0.1, size * 0.035, size * 0.06, 22.5);
  parts.push(`<circle cx="${c}" cy="${c}" r="${size * 0.04}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="none"/><g fill="none" stroke="#2b2b3a" stroke-width="4">${parts.join("")}</g></svg>`;
}
