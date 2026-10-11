# Paiol · ferramentas internas

Funcionários precisam criar etiquetas de balcão, consultar a marca e preparar
posts de oferta sem depender de um editor gráfico. O acesso continua por link,
sem login; nada é salvo em servidor. As páginas pedem para não ser indexadas.

## Navegação

No computador, menu lateral que recolhe para ícones; a escolha fica no localStorage (`nav`) e é
aplicada por um script no `<head>` antes da pintura, sem salto. No celular (até 767 px), barra
superior com o nome da página e barra de abas embaixo (Início, Etiquetas, Ofertas, Marca). Abaixo
de 768 px a tabela de etiquetas vira cartões, o PDF abre no visualizador do aparelho e, em Ofertas,
a prévia vem antes do formulário. Campos de 16 px no celular para o iOS não aproximar a tela.

## Marca

A logo dos cartões permanece. Símbolo, nome (Fraunces 9pt Black em curvas) e
"Produtos naturais" (Nunito Bold em curvas) são extraídos do PDF vetorial; a
versão empilhada mantém as posições do cartão. A horizontal põe o nome ao lado do
paiol, com altura de 60% do símbolo e a mesma base. A versão monocromática mantém
o desenho original em tons de uma cor: telhado, porta e janela a 100%, lateral a 60%,
frente e torre a 35%. A tentativa com porta e janela vazadas foi recusada no verde.
A branca é sólida (transparência deixava a foto aparecer através do paiol), com
frestas só em volta do telhado e do cone e porta e janela vazadas, escolha do usuário.

Cores: verde #347265, vinho #8D313B, palha #F0CDA2, dourado #BFA574,
verde escuro #243C34 e branco. Fraunces Black para chamadas curtas; Poppins para
interface, textos, etiquetas e preços. Os mínimos de tamanho e o tom de voz são
recomendações iniciais do kit, não regras aprovadas antes pela marca.

A fachada entra só no kit: arte da placa em SVG (4 × 1 m) e mockups sobre a foto da loja,
gerados por `scripts/make-facade-mockups.py`. Tom de voz, dados da loja e decisões da marca:
`docs/brand-context.md`.

## Etiquetas

Lista única entre tabela e prévia, salva no localStorage com a chave `products`
(a mesma da versão anterior). O CSV segue o esquema original `name,price,unit`;
a exportação acrescenta `cellType` para preservar os tipos, e a importação aceita
arquivos sem essa coluna, com ponto e vírgula ou com cabeçalhos em português.
A tabela funciona como planilha: setas, Enter e Tab navegam; o preço aceita "5" ou "4,79";
blocos copiados do Excel ou do Planilhas são colados a partir da célula em foco (`pasteGrid`);
a linha de novo produto é a última da tabela, com as mesmas colunas.
Etiquetas de 65 × 30 mm e 95 × 30 mm; as largas vão para o topo, duas por linha,
como antes; as demais seguem a ordem da lista, três por linha; nove linhas por A4.

## Ofertas

Um renderer Canvas (`src/lib/offer.ts`) desenha a prévia e o PNG nos formatos
1:1 (1080 × 1080), 4:5 (1080 × 1350) e 9:16 (1080 × 1920). Textos e logo são posicionados
pelas medidas reais dos glifos; a logo, pelo desenho, descontando a margem de 8% do PNG.
No feed e no retrato, a logo tem a altura do bloco "Oferta" + validade; no story, tudo é
centralizado e fica fora dos 250 px do topo e da base, onde o Instagram desenha os controles.

A sombra das tigelas copia a dos PSDs: duas sombras projetadas em Multiplicação, luz global
a 137°, 23% / distância 30 / tamanho 16 e 39% / 77 / 62, ambas com 8% de ruído (o granulado).

Fotos: `public/products/index.json`, gerado de todos os PSDs por
`scripts/extract-product-photos.py` (fotos repetidas entram uma vez). Fotos enviadas podem ter o
fundo removido no navegador por ormbg (Apache-2.0) com Transformers.js num Web Worker: WebGPU em
fp16, ou WASM em 8 bits; o modelo vem do Hugging Face na primeira vez e fica no cache. Depois do
modelo, o recorte mantém só o maior objeto, preenche o que ele envolve e corta as margens.

## Manutenção

- Logos e kit: `scripts/extract-brand-assets.py` (requer `rsvg-convert`).
- Fotos de produto: `scripts/extract-product-photos.py`.
- Testes de CSV e paginação: `pnpm test`.
