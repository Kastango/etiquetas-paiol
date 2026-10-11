# Contexto da marca Paiol

Fonte única para quem produz material da Paiol: textos, legendas, logos, layouts, placas.
As regras visuais e de voz estão no guia; este arquivo guarda o que o guia não explica:
quem é a loja, de onde vêm as decisões e o que já foi recusado.

## Onde está cada coisa

- Regras de logo, cores, fontes, fachada e tom de voz: `public/brand/guia-da-marca.md`.
  A página `/marca` mostra as mesmas regras a partir de `src/lib/brand.ts`; mude os dois juntos.
- Dados da loja (endereço, WhatsApp, horários): `store` em `src/lib/brand.ts`. Legendas e kit leem dali.
- Escrita no tom da Paiol: `public/brand/paiol-voz/SKILL.md`, a skill que a página `/marca` mostra e o
  kit leva. Ela repete os dados da loja e os exemplos de `src/lib/brand.ts` para funcionar sozinha
  em qualquer assistente; ao mudar um, mude o outro.
- Logos e fotos são gerados por `scripts/extract-brand-assets.py`; a arte e os mockups da fachada,
  por `scripts/make-facade-mockups.py`, que roda depois e acrescenta a pasta fachada ao ZIP.
  As fotos de produto saem dos PSDs por `scripts/extract-product-photos.py`.
  Edite os scripts, nunca os SVG ou PNG gerados.

## A loja

Loja de produtos naturais em Francisco Beltrão (PR), com granel, chás, temperos, suplementos e
cosméticos. Parede da fachada turquesa, interior em madeira clara, potes de acrílico.
O cartão de visitas diz "Centro"; o Google Maps diz "Vila Nova". Até os donos confirmarem,
os materiais usam o endereço sem bairro.

Nas avaliações do Google (4,5 estrelas, 22 avaliações) os clientes elogiam variedade, preço,
organização e atendimento. A dona responde a todas: "Muito obrigada pela avaliação! … precisando
estamos à disposição!".

## Voz real

Legendas do Instagram (julho a outubro de 2026), para calibrar o tom:

- "Localização da Paiol, uma loja completa com produtos naturais de qualidade e com aquele precinho que cabe no seu bolso! Esperamos por vocês."
- "Aqui na paiol você encontra variedades e praticidade. Vem você também!🌿"
- "Venha garantir todas as novidades 💚💚 Coisas boas chegando toda a semana ❣️"
- "Ofertas da semana! Disponível até quando durar os estoques 🍃"
- "Não só atendemos clientes, mas organizamos, embalamos, compramos, repomos mercadoria e assim segue o nosso dia🌧️💚"
- "Muito mais que produtos, nós entregamos qualidade, economia e até mesmo aconchego."

O guia corrige o que estas legendas escorregam: "Paiol" com P maiúsculo e concordância
("durarem os estoques").

## Decisões do dono

- A logo do cartão (paiol, nome em Fraunces Black, "Produtos naturais" em Nunito) não muda.
- Monocromática verde e preta: tons sólidos do desenho original. A versão com porta e janela
  vazadas e frestas em todas as faces foi recusada. A branca é sólida, com frestas só no
  telhado e no cone e porta e janela vazadas (transparência deixava a foto aparecer no paiol).
- Respiro: a altura do paiol em cada lado. Exceção só em placas, onde a borda faz o respiro.
- Posts: 1:1, 4:5 e 9:16. O horizontal 16:9 foi recusado.
- Placas: fachada e placa de bandeira (a caixa quadrada da coluna), como modelos no kit; sem
  gerador de placas. A placa da fachada deve ser maior que a atual, usando a parede vazia, com a
  logo centralizada e folga em volta.
- Sem login nem banco: o acesso é pelo link, os dados ficam no navegador.

## Antes de entregar

Confira cada peça contra estes pontos, como numa auditoria de marca:

- Logo: um arquivo de `public/brand`, inteiro, com o respiro do guia.
- Cor: só a paleta do guia; texto com contraste de pelo menos 4,5 (títulos grandes, 3).
- Tipo: Fraunces só em chamadas curtas; Poppins no resto.
- Voz: acolhedora, prática e verdadeira; nenhuma promessa de saúde.
- Dados: endereço, WhatsApp e horários iguais a `store`.
