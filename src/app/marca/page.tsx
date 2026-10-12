import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Download, FileText, X } from "lucide-react";
import { CopySwatch } from "@/components/brand/copy-swatch";
import { CopyText } from "@/components/brand/copy-text";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { boxSign, checklist, contrast, examples, facade, logos, monoLogos, monoSeals, pairs, palette, pillars, seals, store, vocabulary, voice, type Logo } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Marca" };

// The brand skill is a file in the kit; the page shows that same file, read at build time.
const skill = readFileSync(join(process.cwd(), "public/brand/paiol-marca/SKILL.md"), "utf8");

const sections = [
  { id: "logo", label: "Logo" },
  { id: "uso", label: "Uso da logo" },
  { id: "cores", label: "Cores" },
  { id: "tipografia", label: "Tipografia" },
  { id: "fachada", label: "Fachada" },
  { id: "tom", label: "Tom de voz" },
  { id: "assistente", label: "Assistente de IA" },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t py-12">
      <h2 id={`${id}-title`} className="font-display text-2xl font-black tracking-tight">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted-foreground">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function LogoCard({ logo }: { logo: Logo }) {
  // Seals are round and carry small text: they get the card's full height.
  const height = logo.ratio === 1 ? 128 : 96;
  return (
    <li className="flex flex-col overflow-hidden rounded-lg border bg-card">
      <div className={cn("flex h-44 items-center justify-center", height === 128 ? "p-6" : "p-8", logo.background === "green" ? "bg-paiol-verde" : "bg-white")}>
        <Image src={`/brand/${logo.file}.svg`} alt={logo.name} width={Math.round(height * logo.ratio)} height={height}
          className="w-auto max-w-full" style={{ maxHeight: height }} />
      </div>
      <div className="flex flex-1 flex-col gap-3 border-t p-4">
        <div>
          <h3 className="font-semibold">{logo.name}</h3>
          <p className="text-sm text-muted-foreground">{logo.use}</p>
        </div>
        <div className="mt-auto flex gap-2">
          <Button asChild variant="outline" size="sm"><a href={`/brand/${logo.file}.svg`} download><Download /> SVG</a></Button>
          <Button asChild variant="outline" size="sm"><a href={`/brand/${logo.file}.png`} download><Download /> PNG</a></Button>
        </div>
      </div>
    </li>
  );
}

const misuse = [
  { label: "Não estique nem achate", className: "scale-x-[1.45]" },
  { label: "Não troque as cores", className: "hue-rotate-[150deg] saturate-200" },
  { label: "Não aplique sombra ou efeito", className: "drop-shadow-[6px_6px_3px_rgba(0,0,0,0.55)]" },
  { label: "Não gire nem incline", className: "-rotate-12" },
];

// The SVGs carry 8% of the barn height as padding; the clear space is measured from the drawing itself.
const LOGO = 60, BARN = LOGO / 1.16, PAD = BARN * 0.08, CLEAR = BARN - PAD;

function ClearSpace() {
  const hatch = "repeating-linear-gradient(135deg, rgb(141 49 59 / 0.14) 0 2px, transparent 2px 7px)";
  return (
    <figure className="relative border border-dashed border-paiol-vinho/60" style={{ padding: CLEAR, background: hatch }}>
      <div className="relative bg-white">
        <Image src="/brand/paiol-horizontal-color.svg" alt="" width={172} height={LOGO} style={{ height: LOGO }} className="w-auto" />
        <div className="absolute border border-paiol-verde/50" style={{ inset: PAD }} />
      </div>
      {/* One barn height, shown in the top and left margins as the unit of measure. */}
      <Image src="/brand/paiol-symbol-green.svg" alt="" width={51} height={LOGO} aria-hidden
        className="absolute w-auto opacity-30" style={{ height: LOGO, top: -PAD, left: CLEAR }} />
      <Image src="/brand/paiol-symbol-green.svg" alt="" width={51} height={LOGO} aria-hidden
        className="absolute w-auto opacity-30" style={{ height: LOGO, top: CLEAR, left: (BARN - BARN * 0.85) / 2 - PAD }} />
      <figcaption className="sr-only">Área livre igual à altura do paiol em todos os lados da logo.</figcaption>
    </figure>
  );
}

/** Before and after photos; `focus` keeps the sign in frame when the photo is cropped to 4:3. */
function MockupRow({ before, options, focus = "object-top" }: {
  before: { src: string; alt: string };
  focus?: string;
  options: { name: string; mockup: string; art: string; alt: string; text: string; recommended: boolean }[];
}) {
  return (
    <ul className={cn("mt-4 grid gap-4 sm:grid-cols-2", options.length === 3 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      <li className="flex flex-col overflow-hidden rounded-lg border bg-card">
        <Image src={before.src} alt={before.alt} width={960} height={1000} className={cn("aspect-[4/3] w-full object-cover", focus)} />
        <div className="border-t p-4">
          <h4 className="font-semibold">Hoje</h4>
          <p className="mt-1 text-sm text-muted-foreground">Logo antiga, “PAIOL” em maiúsculas.</p>
        </div>
      </li>
      {options.map(option => (
        <li key={option.mockup} className="flex flex-col overflow-hidden rounded-lg border bg-card">
          <Image src={`/brand/fachada/${option.mockup}.jpg`} alt={option.alt} width={960} height={1000} className={cn("aspect-[4/3] w-full object-cover", focus)} />
          <div className="flex flex-1 flex-col gap-3 border-t p-4">
            <div>
              <h4 className="font-semibold">{option.name}{option.recommended && <span className="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium">Recomendada</span>}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{option.text}</p>
            </div>
            <div className="mt-auto flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm"><a href={`/brand/fachada/${option.art}.svg`} download><Download /> Arte SVG</a></Button>
              <Button asChild variant="outline" size="sm"><a href={`/brand/fachada/${option.mockup}.jpg`} download><Download /> Mockup</a></Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SignSpecs({ specs }: { specs: [string, string][] }) {
  return (
    <div className="mt-4 rounded-lg border bg-card p-6">
      <h4 className="text-sm font-semibold">Para a empresa de comunicação visual</h4>
      <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        {specs.map(([term, text]) => (
          <div key={term}><dt className="font-medium">{term}</dt><dd className="text-muted-foreground">{text}</dd></div>
        ))}
      </dl>
    </div>
  );
}

export default function BrandPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-10 md:py-8">
      <PageHeader
        title="Marca"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><a href="/brand/guia-da-marca.md" download><FileText /> Guia em texto</a></Button>
            <Button asChild><a href="/brand/paiol-brand-kit.zip" download><Download /> Baixar kit completo</a></Button>
          </div>
        }
      >
        Tudo o que você precisa para usar a marca Paiol: logos, cores, fontes e o jeito de falar com os clientes.
      </PageHeader>

      <nav aria-label="Seções da marca" className="sticky top-14 z-20 -mx-4 mb-2 flex gap-1 overflow-x-auto bg-background/95 px-4 py-2 sm:-mx-6 sm:px-6 backdrop-blur-sm md:top-0 md:-mx-10 md:px-10">
        {sections.map(s => (
          <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="grid items-center gap-8 rounded-xl bg-paiol-verde p-8 text-white md:grid-cols-[auto_1fr] md:p-12">
        <Image src="/brand/paiol-stacked-reversed.svg" alt="Paiol Produtos Naturais" width={289} height={220} className="h-40 w-auto md:h-48" priority />
        <div className="max-w-md md:border-l md:border-white/25 md:pl-8">
          <p className="font-display text-2xl font-semibold leading-snug">
            Produtos naturais em Francisco Beltrão.
          </p>
          <p className="mt-3 text-sm text-white/80">
            O paiol, o verde e o nome identificam a loja. Mantenha esse conjunto sempre igual e deixe o produto aparecer.
          </p>
        </div>
      </div>

      <Section id="logo" title="Logo" intro="Use sempre os arquivos daqui. SVG para gráficas e designers; PNG com fundo transparente para documentos, apresentações e redes.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{logos.map(logo => <LogoCard key={logo.file} logo={logo} />)}</ul>
        <h3 className="mt-10 font-semibold">Versões monocromáticas</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Quando não dá para usar as cores da marca. Verde e preta mantêm o desenho original em tons de uma só cor. A branca é sólida, com o telhado destacado e porta e janela vazadas, para funcionar sobre fotos.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{monoLogos.map(logo => <LogoCard key={logo.file} logo={logo} />)}</ul>
        <h3 className="mt-10 font-semibold">Selo</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          O nome em volta do paiol, para espaços redondos. As letras do anel são as de “Produtos naturais” no cartão. Também em preto, para carimbo, e em branco, para fotos.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{seals.map(logo => <LogoCard key={logo.file} logo={logo} />)}</ul>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{monoSeals.map(logo => <LogoCard key={logo.file} logo={logo} />)}</ul>
      </Section>

      <Section id="uso" title="Uso da logo" intro="Regras para a logo continuar legível e igual em todos os lugares.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Área de respiro</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Deixe livre, em volta da logo, pelo menos a altura do paiol em cada lado. Nada de texto, borda ou imagem nessa área. No selo, deixe livre um décimo do diâmetro.
            </p>
            <div className="mt-6 flex justify-center bg-white py-6">
              <ClearSpace />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Tamanho mínimo</h3>
            <p className="mt-1 text-sm text-muted-foreground">Abaixo disso o nome perde a leitura; use o símbolo. Na dúvida, imprima uma prova.</p>
            <dl className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <div className="flex h-[100px] items-end"><Image src="/brand/paiol-horizontal-color.svg" alt="" width={140} height={49} className="h-[49px] w-auto" /></div>
                <dt className="mt-3 text-sm font-medium">Horizontal</dt>
                <dd className="font-mono text-sm text-muted-foreground">140 px · 35 mm</dd>
              </div>
              <div>
                <div className="flex h-[100px] items-end"><Image src="/brand/paiol-symbol.svg" alt="" width={24} height={28} className="h-7 w-auto" /></div>
                <dt className="mt-3 text-sm font-medium">Símbolo</dt>
                <dd className="font-mono text-sm text-muted-foreground">24 px · 8 mm</dd>
              </div>
              <div>
                <div className="flex h-[100px] items-end"><Image src="/brand/paiol-seal-color.svg" alt="" width={100} height={100} className="size-[100px]" /></div>
                <dt className="mt-3 text-sm font-medium">Selo</dt>
                <dd className="font-mono text-sm text-muted-foreground">100 px · 25 mm</dd>
              </div>
            </dl>
          </div>
        </div>

        <h3 className="mt-10 font-semibold">Fundos</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          <li className="rounded-lg border bg-white p-6 text-center">
            <Image src="/brand/paiol-horizontal-color.svg" alt="" width={160} height={56} className="mx-auto h-14 w-auto" />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm"><Check className="size-4 text-primary" aria-hidden /> Branco ou claro: colorida</p>
          </li>
          <li className="rounded-lg border bg-paiol-verde p-6 text-center text-white">
            <Image src="/brand/paiol-horizontal-reversed.svg" alt="" width={160} height={56} className="mx-auto h-14 w-auto" />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm"><Check className="size-4" aria-hidden /> Verde Paiol: nome em branco</p>
          </li>
          <li className="relative overflow-hidden rounded-lg border p-6 text-center">
            <Image src="/products/nozes-chilenas-quebradas.png" alt="" fill sizes="20rem" className="object-cover" />
            <div className="relative">
              <Image src="/brand/paiol-horizontal-color.svg" alt="" width={160} height={56} className="mx-auto h-14 w-auto" />
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 text-sm"><X className="size-4 text-paiol-vinho" aria-hidden /> Foto com detalhes atrás</p>
            </div>
          </li>
        </ul>

        <h3 className="mt-10 font-semibold">Evite</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {misuse.map(m => (
            <li key={m.label} className="rounded-lg border bg-card">
              <div className="flex h-32 items-center justify-center overflow-hidden bg-white">
                <Image src="/brand/paiol-horizontal-color.svg" alt="" width={137} height={48} className={cn("h-12 w-auto", m.className)} />
              </div>
              <p className="flex items-center gap-1.5 border-t p-3 text-sm"><X className="size-4 shrink-0 text-paiol-vinho" aria-hidden /> {m.label}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="cores" title="Cores" intro="O verde identifica a Paiol. O vinho chama atenção para ofertas. Palha e dourado acompanham, sem disputar. Clique no código para copiar.">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{palette.map(s => <CopySwatch key={s.hex} swatch={s} />)}</ul>
        <h3 className="mt-10 font-semibold">Combinações de texto</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Contraste medido pelo padrão WCAG. A partir de 4,5 serve para qualquer texto; entre 3 e 4,5, só para títulos grandes.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map(pair => {
            const ratio = contrast(pair.text, pair.background);
            const verdict = ratio >= 4.5 ? "Qualquer texto" : ratio >= 3 ? "Só títulos grandes" : "Não use em texto";
            return (
              <li key={pair.text + pair.background} className="flex items-center gap-4 rounded-lg border p-4" style={{ background: pair.background }}>
                <span className="font-display text-3xl font-black" style={{ color: pair.text }}>Aa</span>
                <span className="rounded-sm bg-white/90 px-2 py-1 text-xs text-paiol-texto">
                  <span className="font-mono">{ratio.toFixed(1).replace(".", ",")}</span> · {verdict}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          Para gráficas: os valores acima são RGB, para tela. Peça à gráfica a conversão para CMYK com prova de cor no papel escolhido.
        </p>
      </Section>

      <Section id="tipografia" title="Tipografia" intro="Duas famílias, ambas gratuitas. Fraunces é a família do nome Paiol; Poppins é a das etiquetas e dos textos.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-card p-6">
            <p className="font-display text-6xl font-black leading-none text-paiol-verde">Oferta</p>
            <h3 className="mt-6 font-semibold">Fraunces Black</h3>
            <p className="mt-1 text-sm text-muted-foreground">Chamadas curtas e títulos: Oferta, Novidade, Natal. Uma ou duas palavras, nunca em parágrafos.</p>
            <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="https://fonts.google.com/specimen/Fraunces" target="_blank" rel="noreferrer">
              Google Fonts <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <p className="text-2xl font-bold leading-tight">Nozes chilenas quebradas</p>
            <p className="mt-1 text-4xl font-extrabold leading-none">R$ 4,79 <span className="text-lg font-medium">100g</span></p>
            <h3 className="mt-6 font-semibold">Poppins</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Regular 400 para textos, Semibold 600 para destaques, Bold 700 para nomes de produto e ExtraBold 800 para preços.
            </p>
            <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline" href="https://fonts.google.com/specimen/Poppins" target="_blank" rel="noreferrer">
              Google Fonts <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
          O nome Paiol na logo é desenho, não texto: nunca escreva “Paiol” com uma fonte para imitar a logo. As fontes vêm no kit completo.
        </p>
      </Section>

      <Section id="fachada" title="Fachada" intro="As placas da frente ainda usam a logo antiga. Os modelos abaixo usam a logo nova, montados sobre fotos atuais da loja.">
        <h3 className="font-semibold">Placa da fachada</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A parede tem muito espaço livre em volta da placa atual. A nova ocupa esse espaço, cerca de 40% mais larga e 70% mais
          alta, sem encostar no telhado nem no toldo, e a logo fica no centro com folga.
        </p>
        <MockupRow before={{ src: "/brand/fachada/fachada-atual.jpg", alt: "Fachada atual da Paiol: parede turquesa e placa branca com a logo antiga" }}
          options={facade} />
        <SignSpecs specs={[
          ["Medida", "Arte em 5,7 × 1,7 m (proporção 10:3), em milímetros, se a placa atual tiver 4 × 1 m. Meça a parede e ajuste sem distorcer a logo."],
          ["Logo", "Horizontal com “Produtos naturais”, centralizada, com metade da altura da placa: sobra meia altura do paiol em cima e embaixo."],
          ["Leitura", "O nome fica com cerca de 58 cm de altura; “Produtos naturais”, com 10 cm. Conte 1 cm de letra para cada metro de distância."],
          ["Material", "ACM (alumínio composto) com adesivo vinílico impresso, fixado com afastadores na parede."],
          ["Cor", "Verde Paiol #347265. Peça uma prova do adesivo e confira à luz do dia, ao lado da parede."],
          ["Margem na parede", "No modelo sobram cerca de 45 cm até o telhado e 25 cm até o toldo, à esquerda. Confira na medição da parede."],
        ]} />

        <h3 className="mt-12 font-semibold">Placa de bandeira</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          A caixa quadrada na coluna ao lado da porta, vista de quem passa na calçada. Troca só a face: logo empilhada e o WhatsApp
          no lugar do telefone antigo.
        </p>
        <MockupRow before={{ src: "/brand/fachada/bandeira-atual.jpg", alt: "Placa de bandeira atual, quadrada, com a logo antiga e um telefone fixo" }}
          options={boxSign} focus="object-center" />
        <SignSpecs specs={[
          ["Medida", "Arte quadrada de 80 × 80 cm, em milímetros. Meça a face da caixa e ajuste mantendo o quadrado."],
          ["Logo", "Empilhada, como no cartão, com 60% da altura da face. O WhatsApp vai embaixo, em contorno."],
          ["Leitura", "O nome fica com cerca de 11 cm de altura; para a calçada e para quem passa de carro devagar."],
          ["Material", "Lona ou acrílico translúcido para caixa iluminada, nas duas faces da bandeira."],
        ]} />
      </Section>

      <Section id="tom" title="Tom de voz" intro="Como a Paiol fala no Instagram, nas respostas às avaliações e no balcão. Os exemplos vêm do que a loja já escreve.">
        <h3 className="font-semibold">O que os clientes dizem</h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Nas avaliações do Google (4,5 estrelas), quatro elogios se repetem. São as promessas que a comunicação reforça.</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(p => (
            <li key={p.title} className="rounded-lg border bg-card p-5">
              <h4 className="font-display text-lg font-black text-paiol-verde">{p.title}</h4>
              <p className="mt-2 text-sm italic text-muted-foreground">“{p.quote}”</p>
            </li>
          ))}
        </ul>

        <h3 className="mt-10 font-semibold">Jeito de falar</h3>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {voice.map(v => (
            <li key={v.title} className="rounded-lg border bg-card p-6">
              <h4 className="font-display text-xl font-black text-paiol-verde">{v.title}</h4>
              <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold">Expressões da casa</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {vocabulary.use.map(phrase => <li key={phrase} className="rounded-full bg-secondary px-3 py-1 text-sm">{phrase}</li>)}
            </ul>
          </div>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-semibold">Nome</dt><dd className="text-muted-foreground">{vocabulary.name}</dd></div>
            <div><dt className="font-semibold">Emojis</dt><dd className="text-muted-foreground">{vocabulary.emoji}</dd></div>
            <div><dt className="font-semibold">Hashtags</dt><dd className="text-muted-foreground">{vocabulary.hashtags}</dd></div>
          </dl>
        </div>

        <h3 className="mt-10 font-semibold">Exemplos</h3>
        <ul className="mt-4 space-y-3">
          {examples.map(e => (
            <li key={e.prefer} className="grid gap-3 md:grid-cols-[6rem_1fr_1fr] md:items-stretch">
              <span className="pt-4 text-sm font-medium text-muted-foreground">{e.channel}</span>
              <p className="flex gap-3 rounded-lg border border-primary/30 bg-card p-4 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-label="Prefira" /> {e.prefer}
              </p>
              <p className="flex gap-3 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                <X className="mt-0.5 size-4 shrink-0 text-paiol-vinho" aria-label="Evite" /> {e.avoid}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Antes de publicar</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {checklist.map(item => (
                <li key={item} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {item}</li>
              ))}
            </ul>
            <Button asChild className="mt-6"><Link href="/ofertas">Criar post de oferta <ArrowRight /></Link></Button>
          </div>
          <div className="rounded-lg border bg-card p-6 text-sm">
            <h3 className="font-semibold">Dados da loja</h3>
            <p className="mt-3 text-muted-foreground">{store.address}</p>
            <p className="text-muted-foreground">WhatsApp {store.whatsapp}</p>
            <p className="text-muted-foreground">{store.instagram}</p>
            <ul className="mt-3 text-muted-foreground">{store.hours.map(h => <li key={h}>{h}</li>)}</ul>
          </div>
        </div>
      </Section>

      <Section id="assistente" title="Assistente de IA" intro="A marca inteira numa skill para assistentes de IA: tom de voz, cores, logo, fontes e o que tem no kit. Legendas, respostas, cartazes e pedidos à gráfica saem no jeito da Paiol e com os dados certos.">
        <div className="rounded-lg border bg-card p-6">
          <p className="max-w-3xl text-sm text-muted-foreground">
            No Claude, envie o arquivo .zip em Configurações → Capacidades → Skills. No ChatGPT, no Gemini ou em outro
            assistente, copie o texto e cole nas instruções do projeto ou do GPT.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyText text={skill} label="Copiar a skill" />
            <Button asChild variant="outline"><a href="/brand/paiol-marca.zip" download><Download /> Baixar para o Claude (.zip)</a></Button>
            <Button asChild variant="outline"><a href="/brand/paiol-marca/SKILL.md" download><Download /> SKILL.md</a></Button>
          </div>
          <details className="mt-4 rounded-md border bg-muted/40">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium">Ver o texto da skill</summary>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t px-4 py-3 font-mono text-xs leading-relaxed">{skill}</pre>
          </details>
        </div>
      </Section>
    </div>
  );
}
