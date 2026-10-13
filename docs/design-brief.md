# Paiol · ferramentas internas

Funcionários precisam criar etiquetas de balcão, consultar a marca e preparar
posts de oferta sem depender de um editor gráfico. O acesso continua por link,
sem login; nada é salvo em servidor. As páginas pedem para não ser indexadas.

## Navegação

No computador, menu lateral que recolhe para ícones; a escolha fica no localStorage (`nav`) e é
aplicada por um script no `<head>` antes da pintura, sem salto. No celular (até 767 px), barra
superior com o nome da página e barra de abas embaixo (Início, Etiquetas, Ofertas, Horários, Marca). Abaixo
de 768 px a tabela de etiquetas vira cartões, o PDF abre no visualizador do aparelho e, em Ofertas
e Horários, a prévia vem antes do formulário. Campos de 16 px no celular para o iOS não aproximar a tela.

## Marca

A logo dos cartões permanece. Símbolo, nome (Fraunces 9pt Black em curvas) e
"Produtos naturais" (Nunito Bold em curvas) são extraídos do PDF vetorial; a
versão empilhada mantém as posições do cartão. A horizontal põe o nome ao lado do
paiol, com altura de 60% do símbolo, centrado no centro óptico do paiol (o centroide
do desenho, abaixo do centro da caixa, que o cone da torre puxa para cima); escolha do
usuário em outubro de 2026, antes o nome dividia a base com o paiol. Na versão com
assinatura, nome e "Produtos naturais" ficam centrados no mesmo ponto, e a assinatura
divide a base com o paiol. A versão monocromática mantém
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
Tipos de etiqueta (`src/lib/label-types.ts`): Padrão e Título (65 × 30 mm) e Largo (95 × 30 mm),
fixos, com os ids `default`, `title` e `larger` do CSV original; e os criados pela equipe, com nome,
largura, altura e preço embaixo, ao lado ou sem preço, salvos no localStorage (`label-types`). O
`cellType` do produto é o id do tipo; o CSV aceita id ou nome, e um tipo que não existe no navegador
é um erro que diz qual criar. Apagar um tipo devolve os produtos dele para Padrão.
Cada linha da folha leva um só tamanho, para cortar reto: do mais largo (depois o mais alto) ao
menor, como as largas iam para o topo; cada tamanho na ordem da lista; a página quebra pela altura
(200 × 287 mm úteis), o que dá as nove linhas de 30 mm de antes.
O nome é encaixado antes do react-pdf (`src/lib/label-layout.ts`): o maior corpo em que cabe
sem quebrar palavras (18 pt nas etiquetas com preço, 20 pt nos títulos, até 10 pt, a 30 mm de
altura; corpos, preço e margens acompanham a altura do tipo), medido com as larguras da Poppins;
se nenhum couber, a palavra longa é hifenizada. O nome nunca invade o preço: preço ao lado que
deixaria menos de 35% da largura para o nome desce para baixo dele.

## Ofertas

Um renderer Canvas (`src/lib/offer.ts`) desenha a prévia e o PNG nos formatos
1:1 (1080 × 1080), 4:5 (1080 × 1350) e 9:16 (1080 × 1920). Textos e logo são posicionados
pelas medidas reais dos glifos; a logo, pelo desenho, descontando a margem de 8% do PNG.
No feed e no retrato, a logo tem a altura do bloco "Oferta" + validade; no story, tudo é
centralizado: o bloco da faixa verde fica no meio da faixa inteira, para o verde não sobrar embaixo,
mas termina 150 px acima da base (barra de resposta); nada entra nos 250 px do topo.

Tema Padrão ou uma data comemorativa (`src/lib/occasions.ts`): Ano Novo, Carnaval, Dia do
Consumidor, Páscoa, os feriados nacionais, Dia das Mães, Namorados, Festa Junina, Dia dos Pais, Dia
das Crianças, Black Friday e Natal, listados pela próxima data (as móveis vêm da Páscoa ou do n-ésimo
domingo do mês). Cada data traz uma paleta sugerida e uma alternativa no verde Paiol, chamadas
sugeridas (botões abaixo do campo) e o emoji da legenda. Branco sobre a faixa tem 4,5:1 e o destaque
3:1 (`occasions.test.ts`). Nas datas, a faixa cresce para perto de 40% do post, como no Natal de
2022, e a foto e o texto sobem (`dated` em cada formato de `offer.ts`); a tigela pode encostar na
faixa. A logo é a colorida, como naquele Natal; a branca só na faixa vinho, onde o telhado some. Uma
chamada com quebras marcadas por | diminui até um quarto antes de ganhar uma linha a mais. Escolher uma data leva a validade para a
véspera do feriado ou para o próprio dia, nunca um domingo (a loja fecha).

O Natal segue os posts de dezembro de 2022 (PSDs "amendoas sem casca" e "storie natal paiol"):
faixa vermelha, "Oferta | *especial* | de Natal" com a palavra em amarelo e, no story, o cordão de
luzes daquele PSD. Mudanças em relação ao PSD: chamada em Fraunces, como no tema padrão, e não em
Poppins itálico; vermelho #D9363C, um pouco mais fundo que o #EF4C4F do PSD, pelo contraste da
validade. As outras datas seguem o mesmo padrão. Em qualquer tema, `|` quebra a linha da chamada e
`*palavra*` a destaca; a chamada tem até três linhas, do tamanho que couber na faixa.

A validade é uma data (padrão: uma semana a partir de hoje, "Válida até 18 de outubro.") ou
"Válida enquanto durarem os estoques."; o post e a legenda escrevem o texto a partir dessa escolha
(`validityText`). Um rascunho salvo com data já passada volta para daqui a uma semana.

A sombra das tigelas copia a dos PSDs: duas sombras projetadas em Multiplicação, luz global
a 137°, 23% / distância 30 / tamanho 16 e 39% / 77 / 62, ambas com 8% de ruído (o granulado).

Fotos: `public/products/index.json`, gerado de todos os PSDs por
`scripts/extract-product-photos.py` (fotos repetidas entram uma vez). Fotos enviadas podem ter o
fundo removido no navegador por ormbg (Apache-2.0) com Transformers.js num Web Worker: WebGPU em
fp16, ou WASM em 8 bits; o modelo vem do Hugging Face na primeira vez e fica no cache. Depois do
modelo, o recorte mantém só o maior objeto, preenche o que ele envolve e corta as margens.
Os links para Pexels, Unsplash, Freepik e Google buscam em inglês ("walnuts bowl top view"):
`src/lib/stock-search.ts` traduz o nome com um glossário de produtos naturais; produto novo que a
loja passe a vender entra no glossário. Nome sem nenhuma palavra conhecida é buscado como digitado.

## Horários

Cartaz de horário de funcionamento a partir do modelo que a loja usava no Canva: faixa verde com a
logo sobre verde, o título em maiúsculas sobre um fio verde, cada linha com os dias em Poppins 400 e
o horário em Poppins 600, e o WhatsApp no canto de baixo, com o ícone do Simple Icons (CC0). O antigo
"PAIOL" em maiúsculas foi trocado pela logo do kit. Linhas, título, aviso (em vinho, para feriados) e
WhatsApp são editáveis; o rascunho fica no localStorage (`hours-draft`) e há um botão para voltar ao
horário da loja. O renderer Canvas (`src/lib/hours.ts`) desenha numa largura de 1080 e escala para
A4 (2480 × 3508, 300 dpi, também em PDF de uma página), feed 4:5 e story 9:16, este com a logo abaixo
dos 250 px do topo e o WhatsApp acima dos 150 px de baixo. As linhas ficam centradas entre o fio e o
WhatsApp; se não cabem, o espaço entre elas fecha até 60% antes de as letras diminuírem. O texto
para copiar segue o tom da marca e termina com o endereço da loja. Com uma data
comemorativa, faixa, fio, ícone e aviso ficam na cor da data e a logo segue a regra das ofertas.
O texto sugerido de um feriado lista os dias, com o feriado fechado (e os dias em volta, no Natal,
Ano Novo, Carnaval e Páscoa, como exemplo a conferir), e diz quando a loja reabre, pulando o domingo;
nas outras datas, o horário de sempre com uma mensagem. Trocar de tema só troca o texto que ainda
está no sugerido do tema anterior; "Usar texto sugerido" aplica o da data de propósito.

## Manutenção

- Logos e kit: `scripts/extract-brand-assets.py` (requer `rsvg-convert`).
- Fotos de produto: `scripts/extract-product-photos.py`.
- Luzes de Natal: `scripts/extract-christmas-lights.py`, do PSD "storie natal paiol".
- Testes de CSV e paginação: `pnpm test`.
