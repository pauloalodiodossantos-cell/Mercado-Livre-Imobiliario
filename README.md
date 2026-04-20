# Mercado Livre de Imoveis MVP (Backend)

API utilizavel para demonstrar a jornada: **vitrine com valuation**, **oferta**, **aceite**, **due diligence (stub)**, **CCV em Markdown (stub)**, **conta garantia (stub + simulacao de deposito)**.

Stack: Node.js, TypeScript, Express, Prisma 7, PostgreSQL em producao (`@prisma/adapter-pg`), testes com PGlite (sem Docker).

## Jornada minima (ordem sugerida)

1. `POST /auth/register` — criar vendedor (`SELLER`) e comprador (`BUYER`).
2. `POST /listings` (Bearer do vendedor) — publica imovel; resposta inclui `valuation` (cap rate, IRR estimado, desconto vs teto regional).
3. `GET /listings` ou `GET /listings/:id` — vitrine (publico).
4. `POST /listings/:listingId/offers` (Bearer do comprador) — envia proposta; `earnestMoney` opcional (padrao 5% do valor ofertado).
5. `POST /offers/:offerId/accept` (Bearer do vendedor) — aceita; cria **DD stub**, **contrato rascunho**, **escrow PENDING_FUNDING**; listing vai para `UNDER_OFFER`.
6. `GET /offers/:offerId/pipeline` (Bearer comprador ou vendedor) — estado consolidado da esteira.
7. `POST /offers/:offerId/escrow/simulate-funding` — **somente demo**: marca escrow como `FUNDED` (substitui webhook BaaS no MVP).

## Endpoints

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Listings
- `GET /listings` — `?status=PUBLISHED` (padrao) ou `DRAFT`
- `GET /listings/:id`
- `POST /listings` — `SELLER`; body pode incluir `estimatedMonthlyRent`, `regionalPriceCeilingPerM2` para refinar o valuation
- `POST /listings/:listingId/offers` — `BUYER` ou `BROKER`; body `{ "offerPrice": number, "earnestMoney?": number }`

### Offers / esteira
- `GET /offers/mine` — ofertas do comprador autenticado
- `POST /offers/:offerId/accept` — `SELLER` dono do anuncio
- `GET /offers/:offerId/pipeline` — comprador ou vendedor da transacao
- `POST /offers/:offerId/escrow/simulate-funding` — demo de deposito no escrow

### Health
- `GET /health`

## Demo local sem Postgres (Postman / navegador)

Sobe a API com **PGlite** (dados so em memoria; ao fechar o processo some tudo):

```bash
npm run dev:demo
```

Abra `http://localhost:3000/health` e siga o fluxo do README. Nao precisa de `DATABASE_URL`.

## Producao (Postgres)

1. Definir `DATABASE_URL` e `JWT_SECRET` no `.env`.
2. `npm install` && `npm run prisma:generate`
3. `npm run prisma:migrate:deploy` (aplica todas as pastas em `prisma/migrations` em ordem)
4. `npm run dev` (ou `npm run build` + `npm start`)

## Testes

- `npm test` — integracao com PGlite (usa `NODE_OPTIONS=--experimental-vm-modules`).
- `npm run build` — compilacao TypeScript.

## Proximas integracoes (fora do escopo deste MVP)

- LegalTechs reais (certidoes / matricula), PDF do CCV, DocuSign/Gov.br, BaaS real e webhooks, cartorio.
