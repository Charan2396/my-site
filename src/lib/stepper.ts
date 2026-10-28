// Client-side stepper for the explainers (same pattern as fig. 3 in Pipeline.astro).
// Markup: [data-stepper="optional name"] > [data-controls hidden] with [data-go="-1|1"] and [data-count],
// [data-live], and [data-step-item] > h3. Without JS every step stays visible as a numbered list.
// Idempotent: roots get data-ready. Pass a signal so a later phase can run this on astro:page-load
// and abort the listeners on astro:before-swap.
export function initSteppers(signal?: AbortSignal) {
	for (const root of document.querySelectorAll<HTMLElement>('[data-stepper]:not([data-ready])')) {
		root.dataset.ready = '';
		signal?.addEventListener('abort', () => delete root.dataset.ready);
		const steps = [...root.querySelectorAll<HTMLElement>('[data-step-item]')];
		const controls = root.querySelector<HTMLElement>('[data-controls]')!;
		const count = root.querySelector<HTMLElement>('[data-count]')!;
		const live = root.querySelector<HTMLElement>('[data-live]')!;
		const prefix = root.dataset.stepper ? `${root.dataset.stepper}, step` : 'Step';
		let step = 0;
		const go = (n: number, announce = true) => {
			step = Math.max(0, Math.min(steps.length - 1, n));
			steps.forEach((s, j) => (s.hidden = j !== step));
			count.textContent = `${step + 1} / ${steps.length}`;
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
