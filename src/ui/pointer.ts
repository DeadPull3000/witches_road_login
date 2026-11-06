import type { Point } from '../content/vines';
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
  const matrix = svg.getScreenCTM(); if (!matrix) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()); return [point.x, point.y];
}
export function capturePointer(element: Element, pointerId: number) { try { element.setPointerCapture(pointerId); } catch { /* Synthetic or cancelled input has no native capture. */ } }
export function releasePointer(element: Element, pointerId: number) { try { if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId); } catch { /* A removed view can already have released its capture. */ } }

export function svgTransformKey(svg: SVGSVGElement) {
  const matrix = svg.getScreenCTM();
  return matrix ? [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].map(value => value.toFixed(4)).join(':') : '';
}

/** A draft uses the coordinates from its first point. Reframing ends that draft. */
export function watchPointerGeometry(element: Element, cancel: () => void) {
  const observer = new ResizeObserver(cancel);
  observer.observe(element);
  window.addEventListener('resize', cancel);
  window.addEventListener('scroll', cancel, true);
  document.addEventListener('visibilitychange', cancel);
  return () => {
    observer.disconnect();
    window.removeEventListener('resize', cancel);
    window.removeEventListener('scroll', cancel, true);
    document.removeEventListener('visibilitychange', cancel);
  };
}
