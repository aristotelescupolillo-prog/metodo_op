# Correções aplicadas — Método OP

## O que foi corrigido

### 1. `api/generate-image.js`
- Removida a injeção de `tituloBloco` e `textoBloco` no prompt.
- A route agora apenas repassa o `prompt` pronto que vem de `services/api.ts`.
- Isso elimina a contradição "proibido texto + insira este texto" que confundia o modelo.
- Quality elevada para `high`.

### 2. `src/services/api.ts`
- Removido o bloco `PROIBICAO_TEXTO`. Agora GPT-Image-1 PODE e DEVE renderizar título e texto.
- Novo `buildImagePrompt` que entrega ao modelo:
  - Os textos exatos (título e texto de apoio) com hierarquia.
  - As cores da marca (primária, destaque) e a família tipográfica.
  - As regras de composição do mood (não mais só paleta — agora estrutura).
  - A área reservada de 280x140px no canto inferior direito para a logo entrar depois.
- Corrigido o **bug do branch vazio do reels** (`isReels ? : buildImagePrompt(...)` estava sem expressão entre `?` e `:`).
- `moodVisualInstructions` reescrito: cada mood agora descreve a composição completa.
  - **OP-04 Fragmento**: layout cubista de colagem em blocos (não é mais foto fullbleed).
  - **OP-06 Silêncio**: layout split minimalista com muito espaço negativo.
  - **OP-01/02/03/05**: composição própria descrita em detalhe.

### 3. `src/utils/applyLogo.ts`
- Reescrito para fazer apenas UMA coisa: carimbar a logo com **110px de respiro**.
- Mantém a resolução nativa que o GPT-Image-1 devolveu (não força redimensionamento).
- Logo no canto inferior direito, dentro da área que o prompt reservou.

## Arquivo NÃO mexido — `ResultsView.tsx`
Continua chamando `generatePostImage` → `applyLogoToImage`, exatamente como já estava.
A diferença é que agora o que sai do GPT-Image-1 já é a peça pronta de verdade.

## Resumo do fluxo final
```
ContentForm → generateMethodContent (texto)
            ↓
ResultsView → generatePostImage (prompt completo: textos + marca + mood)
            ↓
            GPT-Image-1 (peça inteira: foto + título + texto + design)
            ↓
            applyLogoToImage (só carimba a logo com 110px de respiro)
            ↓
            Preview / Download
```
