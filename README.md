# MÉTODO OP

App independente para produção de conteúdo e peças visuais da OP.

## Fluxo V1
1. Login futuro / acesso
2. Kit de Marca editável
3. Tela de geração de conteúdo baseada no método do Organiza Postagem
4. Escolha de mood/template OP
5. Geração de imagem base
6. Aplicação automática de título, texto, cores, fonte e logo
7. Download: Feed PNG, Carrossel ZIP com 5 cards, Reels imagem pura + texto separado, Stories conteúdo textual

## Rodar localmente
```bash
npm install
npm run dev
```

## Deploy Vercel
Suba este diretório no GitHub e importe na Vercel. Configure `OPENAI_API_KEY` nas variáveis de ambiente.

## Integrações deixadas em aberto
- Supabase Auth
- Supabase Storage
- histórico de gerações
- publicação/agendamento Instagram

## Observação importante
O motor de conteúdo preserva a lógica do Organiza Postagem: segmento, público B2B/B2C, momento do negócio, informação-chave, voz da marca, progressão interna, regras de venda e coordenação Feed ↔ Stories.
