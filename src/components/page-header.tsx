export function PageHeader({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 md:pb-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
        {children && <p className="mt-2 text-muted-foreground">{children}</p>}
      </div>
      {actions}
    </div>
  );
}
