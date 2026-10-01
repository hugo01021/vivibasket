"use client";

import { useEffect, useRef } from "react";

/* ─── Réglages ──────────────────────────────────────────────────────────────
   Toutes les constantes utiles sont regroupées ici.                          */
const STAR_COUNT = 200; // nombre d'étoiles
const STAR_COLOR = "255, 255, 255"; // couleur des étoiles (RVB)
const STAR_RADIUS = [0.5, 1.0] as const; // rayon en px → diamètre 1 à 2 px
const STAR_ALPHA = [0.25, 0.95] as const; // opacité de base
const DRIFT_SPEED = 6; // vitesse de dérive, px/s
const DRIFT_ANGLE = (200 * Math.PI) / 180; // direction de dérive (vers la gauche, légèrement vers le bas)
const TWINKLE_SHARE = 0.6; // part d'étoiles qui scintillent
const TWINKLE_PERIOD = [2, 6] as const; // période de scintillement, s
const GLOW_SHARE = 0.06; // part d'étoiles plus grosses avec halo
const GLOW_RADIUS = [1.3, 1.8] as const; // rayon des étoiles à halo
const SHOOTING_INTERVAL = [1.5, 2.6] as const; // intervalle entre étoiles filantes, s
const SHOOTING_MAX = 2; // jamais plus de deux à la fois
const SHOOTING_LIFE = [0.85, 1.2] as const; // durée de vie, s
const SHOOTING_SPEED = [420, 640] as const; // vitesse, px/s
const SHOOTING_TRAIL = 150; // longueur maximale de la traînée, px
/* ──────────────────────────────────────────────────────────────────────────── */

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  twinkle: boolean;
  period: number;
  phase: number;
  glow: boolean;
};

type ShootingStar = {
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  speed: number;
  life: number;
  age: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeStar(w: number, h: number): Star {
  const glow = Math.random() < GLOW_SHARE;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: glow ? rand(GLOW_RADIUS[0], GLOW_RADIUS[1]) : rand(STAR_RADIUS[0], STAR_RADIUS[1]),
    alpha: rand(STAR_ALPHA[0], STAR_ALPHA[1]),
    twinkle: Math.random() < TWINKLE_SHARE,
    period: rand(TWINKLE_PERIOD[0], TWINKLE_PERIOD[1]),
    phase: Math.random() * Math.PI * 2,
    glow,
  };
}

/** Point de départ choisi pour que la trajectoire traverse la zone visible. */
function makeShootingStar(w: number, h: number): ShootingStar {
  const angle = Math.random() * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const speed = rand(SHOOTING_SPEED[0], SHOOTING_SPEED[1]);
  const life = rand(SHOOTING_LIFE[0], SHOOTING_LIFE[1]);
  const distance = speed * life;
  // Un point de passage dans la partie centrale de l'écran, atteint entre 30 et 70 % du trajet.
  const px = rand(w * 0.15, w * 0.85);
  const py = rand(h * 0.15, h * 0.85);
  const u = rand(0.3, 0.7);
  return { x0: px - dx * distance * u, y0: py - dy * distance * u, dx, dy, speed, life, age: 0 };
}

/**
 * Ciel étoilé animé, en arrière-plan de la page. Canvas transparent et fixe,
 * sans interaction, qui laisse le fond de page inchangé.
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let shooting: ShootingStar[] = [];
    let nextShooting = rand(SHOOTING_INTERVAL[0], SHOOTING_INTERVAL[1]);
    let raf = 0;
    let last = 0;
    let elapsed = 0;
    let running = false;

    const vx = Math.cos(DRIFT_ANGLE) * DRIFT_SPEED;
    const vy = Math.sin(DRIFT_ANGLE) * DRIFT_SPEED;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (stars.length === 0) {
        stars = Array.from({ length: STAR_COUNT }, () => makeStar(width, height));
      } else {
        // On conserve les étoiles existantes en les ramenant dans la nouvelle zone visible.
        for (const s of stars) {
          s.x = ((s.x % width) + width) % width;
          s.y = ((s.y % height) + height) % height;
        }
      }
      draw();
    };

    const update = (dt: number) => {
      elapsed += dt;
      for (const s of stars) {
        s.x += vx * dt;
        s.y += vy * dt;
        if (s.x < -2) s.x += width + 4;
        else if (s.x > width + 2) s.x -= width + 4;
        if (s.y < -2) s.y += height + 4;
        else if (s.y > height + 2) s.y -= height + 4;
      }
      nextShooting -= dt;
      if (nextShooting <= 0) {
        if (shooting.length < SHOOTING_MAX) shooting.push(makeShootingStar(width, height));
        nextShooting = rand(SHOOTING_INTERVAL[0], SHOOTING_INTERVAL[1]);
      }
      for (const s of shooting) s.age += dt;
      shooting = shooting.filter((s) => s.age < s.life);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const t = elapsed;
      for (const s of stars) {
        let alpha = s.alpha;
        if (s.twinkle && !reduceMotion.matches) {
          alpha *= 0.55 + 0.45 * Math.sin((t / s.period) * Math.PI * 2 + s.phase);
        }
        if (s.glow) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, `rgba(${STAR_COLOR}, ${(alpha * 0.45).toFixed(3)})`);
          g.addColorStop(1, `rgba(${STAR_COLOR}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${STAR_COLOR}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of shooting) {
        const travelled = s.speed * s.age;
        const hx = s.x0 + s.dx * travelled;
        const hy = s.y0 + s.dy * travelled;
        const trail = Math.min(SHOOTING_TRAIL, travelled);
        const tx = hx - s.dx * trail;
        const ty = hy - s.dy * trail;
        const progress = s.age / s.life;
        // Apparition rapide puis extinction progressive.
        const fade = progress < 0.12 ? progress / 0.12 : 1 - (progress - 0.12) / 0.88;
        const alpha = Math.max(0, Math.min(1, fade)) * 0.9;
        const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
        gradient.addColorStop(0, `rgba(${STAR_COLOR}, 0)`);
        gradient.addColorStop(1, `rgba(${STAR_COLOR}, ${alpha.toFixed(3)})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
        ctx.fillStyle = `rgba(${STAR_COLOR}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(hx, hy, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || reduceMotion.matches) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onMotionChange = () => {
      if (reduceMotion.matches) {
        stop();
        shooting = [];
        draw(); // étoiles fixes
      } else {
        start();
      }
    };

    resize();
    if (!document.hidden) start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    reduceMotion.addEventListener("change", onMotionChange);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ background: "transparent" }}
    />
  );
}
