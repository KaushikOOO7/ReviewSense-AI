export default function SectionTitle({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">{eyebrow}</p>}
        <h2 className="text-xl font-bold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[22px]">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-[13px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
