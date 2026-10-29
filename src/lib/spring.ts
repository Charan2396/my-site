// One spring for every motion on the site (no animation library).
// Apple's two parameters: damping ratio (1 = critically damped, no overshoot) and response (seconds to
// reach the target; not a duration). Closed-form solution, so a retarget restarts from the exact current
// value and velocity: animations are interruptible and never jump or hit a velocity "brick wall".
// Erasable TypeScript only: tests/e2e/spring.mjs imports this file directly with Node.

export type SpringParams = { damping?: number; response?: number };
export const DEFAULT = { damping: 1, response: 0.35 };
// after a flick only: a little overshoot because the gesture carried momentum
export const MOMENTUM = { damping: 0.8, response: 0.35 };

/** Displacement from target and velocity (units/s) `t` seconds after starting at d0 with velocity v0. */
export function springAt(d0: number, v0: number, t: number, p: SpringParams = DEFAULT): [number, number] {
	const z = Math.min(1, p.damping ?? 1);
	const w = (2 * Math.PI) / (p.response ?? DEFAULT.response);
	if (z >= 1) {
		const e = Math.exp(-w * t), c = v0 + w * d0;
		return [(d0 + c * t) * e, (v0 - w * c * t) * e];
	}
	const wd = w * Math.sqrt(1 - z * z), e = Math.exp(-z * w * t);
	const cos = Math.cos(wd * t), sin = Math.sin(wd * t);
	return [e * (d0 * cos + ((v0 + z * w * d0) / wd) * sin), e * (v0 * cos - ((z * w * v0 + w * w * d0) / wd) * sin)];
}

/** Apple's momentum projection: where a flick released at `v` px/s comes to rest, relative to now. */
export const project = (v: number, rate = 0.998) => ((v / 1000) * rate) / (1 - rate);

/** Rubber band past a boundary: the further past it, the less the element follows. */
export const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

export type Spring = {
	readonly value: number;
	readonly velocity: number;
	readonly target: number;
	readonly running: boolean;
	/** Animate to `target` from the current value; keeps the current velocity unless one is given.
	 *  `shift` re-references the value (e.g. a carousel switching which panel is "current") without a jump. */
	to(target: number, opts?: SpringParams & { velocity?: number; shift?: number }): void;
	/** Jump (no animation), e.g. during a drag or under reduced motion. */
	set(value: number): void;
	stop(): void;
	/** Advance to time `now` (ms); called by requestAnimationFrame, exposed for the self-check. */
	tick(now: number): void;
};

/** `apply` runs once per frame with the presentation value; `onRest` once when it settles. */
export function createSpring(apply: (v: number) => void, init = 0, eps = 0.01, onRest?: () => void): Spring {
	let x0 = init, v0 = 0, target = init, t0 = 0, value = init, velocity = 0;
	let params: SpringParams = DEFAULT;
	let frame = 0, running = false;
	const loop = (now: number) => {
		frame = 0;
		s.tick(now);
		if (running) frame = requestAnimationFrame(loop);
	};
	const s: Spring = {
		get value() { return value; },
		get velocity() { return velocity; },
		get target() { return target; },
		get running() { return running; },
		to(next, opts = {}) {
			const now = performance.now();
			if (running) s.tick(now); // sample the presentation value first: retarget from where it is
			x0 = value = value + (opts.shift ?? 0);
			v0 = opts.velocity ?? velocity;
			target = next;
			t0 = now;
			params = { damping: opts.damping ?? DEFAULT.damping, response: opts.response ?? DEFAULT.response };
			running = true;
			if (!frame) frame = requestAnimationFrame(loop);
		},
		set(v) {
			s.stop();
			x0 = value = target = v;
			velocity = v0 = 0;
			apply(v);
		},
		stop() {
			if (frame) cancelAnimationFrame(frame);
			frame = 0;
			running = false;
		},
		tick(now) {
			if (!running) return;
			const [d, v] = springAt(x0 - target, v0, Math.max(0, now - t0) / 1000, params);
			value = target + d;
			velocity = v;
			if (Math.abs(d) < eps && Math.abs(v) < eps * 10) {
				value = target;
				velocity = 0;
				running = false;
			}
			apply(value);
			if (!running) onRest?.();
		},
	};
	return s;
}

/** Bring a newly shown element in: fade plus a short slide from `dir` (-1, 0, 1); fade only when reduced. */
export function enter(el: HTMLElement, dir: number, reduced: boolean) {
	const dx = reduced ? 0 : dir * 12; // small enough to stay inside a 16px phone gutter
	const s = createSpring(
		(p) => {
			el.style.opacity = String(Math.min(1, Math.max(0, p)));
			el.style.transform = dx ? `translateX(${(1 - p) * dx}px)` : '';
		},
		0,
		0.001,
		() => {
			el.style.opacity = '';
			el.style.transform = '';
		},
	);
	s.set(0);
	s.to(1);
	return s;
}
