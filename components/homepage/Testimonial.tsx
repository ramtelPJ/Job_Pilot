export function Testimonial() {
  return (
    <section className="border-t border-border-light bg-surface px-6 py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          Success Stories
        </span>

        <p className="mt-6 text-2xl font-medium leading-snug text-text-primary sm:text-3xl">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open
          my dashboard to see interviews waiting. It feels like cheating. Had
          3 offers on the table simultaneously.&rdquo;
        </p>

        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-light text-sm font-semibold text-accent">
            TW
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">
              Tom Wilson
            </p>
            <p className="text-xs text-text-muted">Junior Developer</p>
          </div>
        </div>
      </div>
    </section>
  );
}
