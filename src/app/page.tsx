import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { tools } from "@/lib/tools";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-10 md:py-16">
      <p className="text-sm font-medium text-primary">Paiol Produtos Naturais</p>
      <h1 className="mt-2 font-display text-4xl font-black tracking-tight md:text-5xl">Ferramentas internas</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Prepare etiquetas e posts de oferta com a identidade da loja, e consulte como usar a marca.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-3">
        {tools.map(({ href, label, icon: Icon, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex h-full flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-5 text-primary" aria-hidden />
              <span className="mt-4 font-semibold">{label}</span>
              <span className="mt-1 flex-1 text-sm text-muted-foreground">{description}</span>
              <ArrowRight className="mt-4 size-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
