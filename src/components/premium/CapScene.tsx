import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Interactive 3D particle galaxy — hub-grade ambient scene for React Cap apps */
export function CapScene({ intensity = 1 }: { intensity?: number }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !hostRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'cap-scene-canvas cap-scene-canvas--subtle';
    canvas.setAttribute('aria-hidden', 'true');
    hostRef.current.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      canvas.remove();
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 60);
    camera.position.set(0, 0.5, 7.2);

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#0a84ff';
    const accentCol = new THREE.Color(accent);
    const cream = new THREE.Color('#f4f0e8');

    const mobile = window.innerWidth < 640;
    const N = mobile ? 1400 : 2400;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const scl = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const arm = i % 3;
      const r = Math.pow(Math.random(), 0.58) * 5.8;
      const spin = r * 0.88;
      const angle = (arm / 3) * Math.PI * 2 + spin + (Math.random() - 0.5) * 0.5;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * (0.45 + (5.8 - r) * 0.13);
      pos[i * 3 + 2] = Math.sin(angle) * r;
      const c = Math.random() < 0.18 ? accentCol : cream;
      const fade = 0.3 + Math.random() * 0.55;
      col[i * 3] = c.r * fade;
      col[i * 3 + 1] = c.g * fade;
      col[i * 3 + 2] = c.b * fade;
      scl[i] = Math.random() * 1.4 + 0.45;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scl, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: Math.min(window.devicePixelRatio, 2) * (mobile ? 22 : 26) * intensity },
      },
      vertexShader: `
        attribute float aScale;
        uniform float uTime;
        uniform float uSize;
        varying vec3 vColor;
        varying float vTw;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * aScale / -mv.z;
          vColor = color;
          vTw = 0.65 + 0.35 * sin(uTime * 1.4 + position.x * 8.0);
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTw;
        void main() {
          float d = smoothstep(0.5, 0.04, length(gl_PointCoord - 0.5));
          gl_FragColor = vec4(vColor, d * vTw * ${intensity.toFixed(2)});
        }`,
    });

    const pts = new THREE.Points(geo, mat);
    pts.rotation.x = 0.38;
    scene.add(pts);

    let px = 0, py = 0, tx = 0, ty = 0, scrollP = 0;
    let running = true;
    const clock = new THREE.Clock();

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollP = window.scrollY / max;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    let raf = 0;
    function frame() {
      if (!running) return;
      const t = clock.getElapsedTime();
      mat.uniforms.uTime.value = t;
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      pts.rotation.y = t * 0.042 + scrollP * 1.5;
      pts.rotation.x = 0.38 + py * 0.04 + scrollP * 0.35;
      camera.position.x = px * 0.65;
      camera.position.y = 0.5 - py * 0.35 - scrollP * 0.9;
      camera.position.z = 7.2 + scrollP * 2.4;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const onVis = () => {
      running = !document.hidden;
      if (running) {
        clock.start();
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVis);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [intensity]);

  return <div ref={hostRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden />;
}
