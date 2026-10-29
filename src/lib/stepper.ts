import { enter, type Spring } from './spring';

// Client-side stepper for the explainers (same pattern as fig. 3 in Pipeline.astro).
// Markup: [data-stepper="optional name"] > [data-controls hidden] with [data-go="-1|1"] and [data-count],
// [data-live], and [data-step-item] > h3. Without JS every step stays visible as a numbered list.
// Idempotent: roots get data-ready. Run it through onPage() so listeners are released on navigation.
export function initSteppers(signal?: AbortSignal) {
	for (const root of document.querySelectorAll<HTMLElement>('[data-stepper]:not([data-ready])')) {
		root.dataset.ready = '';
		signal?.addEventListener('abort', () => delete root.dataset.ready);
		const steps = [...root.querySelectorAll<HTMLElement>('[data-step-item]')];
		const controls = root.querySelector<HTMLElement>('[data-controls]')!;
		const count = root.querySelector<HTMLElement>('[data-count]')!;
		const live = root.querySelector<HTMLElement>('[data-live]')!;
		const prefix = root.dataset.stepper ? `${root.dataset.stepper}, step` : 'Step';
		const prev = controls.querySelector<HTMLButtonElement>('[data-go="-1"]')!;
		const next = controls.querySelector<HTMLButtonElement>('[data-go="1"]')!;
		let step = 0;
		let anim: Spring | undefined;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		signal?.addEventListener('abort', () => anim?.stop());
		const go = (n: number, announce = true) => {
			const was = step;
			step = Math.max(0, Math.min(steps.length - 1, n));
			anim?.stop();
			steps.forEach((s, j) => {
				s.hidden = j !== step;
				s.style.opacity = s.style.transform = '';
			});
			// the new step slides in from the side it lives on (critically damped spring); fade only when reduced
			if (announce && step !== was) anim = enter(steps[step], Math.sign(step - was), reduced.matches);
			count.textContent = `${step + 1} / ${steps.length}`;
			// no wrap at the ends; a button that loses its use hands focus to the other one
			const f = document.activeElement;
			prev.disabled = step === 0;
			next.disabled = step === steps.length - 1;
			if ((f === prev || f === next) && f.disabled) (f === prev ? next : prev).focus();
			if (announce) live.textContent = `${prefix} ${step + 1} of ${steps.length}: ${steps[step].querySelector('h3')!.textContent}`;
		};
		root.classList.add('is-stepper');
		controls.hidden = false;
		for (const b of controls.querySelectorAll<HTMLButtonElement>('[data-go]'))
			b.addEventListener('click', () => go(step + Number(b.dataset.go)), { signal });
		root.addEventListener(
			'keydown',
			(e) => {
				if (e.altKey || e.ctrlKey || e.metaKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
				e.preventDefault();
				go(step + (e.key === 'ArrowRight' ? 1 : -1));
			},
			{ signal },
		);
		go(0, false);
	}
}

// Run init on every page load (ClientRouter fires astro:page-load on the first load and after each
// navigation) and abort its listeners before the next swap, so they never stack up.
export function onPage(init: (signal: AbortSignal) => void) {
	document.addEventListener('astro:page-load', () => {
		const ac = new AbortController();
		document.addEventListener('astro:before-swap', () => ac.abort(), { once: true });
		init(ac.signal);
	});
}
