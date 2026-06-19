import type { ReactNode } from "react";

type KpiItem = {
  label: string;
  value: number;
  icon: ReactNode;
};

type AdminKpiStripProps = {
  items: KpiItem[];
  columnsClassName: string;
};

export function AdminKpiStrip({
  items,
  columnsClassName,
}: AdminKpiStripProps) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <div className={`grid ${columnsClassName}`}>
        {items.map((item, index) => (
          <div
            key={item.label}
            className={[
              "px-5 py-5",
              index > 0 ? "border-t border-slate-200" : "",
              index > 0 ? "sm:border-t-0 sm:border-l" : "",
              "sm:border-slate-200",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                  {item.value}
                </p>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {item.label}
                </p>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(30,64,175,0.08)] text-[var(--brand)]">
                {item.icon}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
