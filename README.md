# Paiol · ferramentas internas

Site interno da Paiol Produtos Naturais com três ferramentas:

- **Etiquetas** (`/etiquetas`): lista de produtos com importação e exportação CSV e PDF A4 para imprimir.
- **Ofertas** (`/ofertas`): posts de oferta para o Instagram em 1:1, 4:5 e 9:16, baixados em PNG.
- **Marca** (`/marca`): logos em SVG e PNG, cores, fontes, fachada, tom de voz e o kit completo em ZIP.

Os dados ficam no navegador de cada pessoa; não há banco de dados nem login.

Requer Node 24 e pnpm 10 (`corepack enable` usa a versão fixada em `package.json`).

```bash
pnpm install
pnpm dev         # http://localhost:3000
pnpm test        # CSV e paginação das etiquetas
pnpm lint
pnpm typecheck   # TypeScript 7 (tsc nativo)
pnpm build
```

Stack: Next.js 16 (Turbopack, React Compiler), React 19.3, Tailwind CSS 4, TypeScript 7.
O TypeScript 7 ainda não tem API para ferramentas; ESLint e o build do Next usam o pacote
`typescript` apontado para o TypeScript 6 (`@typescript/typescript6`), como a Microsoft recomenda.

## Arquivos da marca

Os arquivos em `public/brand` e `public/products` são gerados a partir do cartão de
visitas em PDF e dos PSDs de ofertas originais:

```bash
uv run --with pymupdf --with pillow scripts/extract-brand-assets.py --pdf /caminho/paiol-cartaoVisitas-CEmail.pdf
uv run --with psd-tools --with pillow --with scipy scripts/extract-product-photos.py --psd-dir /caminho/pasta-dos-psds
```

Depois, a arte e os mockups das placas (sobre as fotos em `scripts/sources/`), que entram
no ZIP do kit:

```bash
uv run --with pillow --with numpy --with fonttools scripts/make-facade-mockups.py
```

Os scripts usam `rsvg-convert` (`brew install librsvg`) para gerar os PNGs.
Decisões de design e formato dos dados: `docs/design-brief.md`.
