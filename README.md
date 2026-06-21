# sincpro-mobile-distribution

App móvil de **Distribución** (React Native / Expo): ventas, facturación, factura electrónica, notas de crédito, pagos, productos y rutas. Es una **app host** del framework Sincpro Mobile: compone `@sincpro/mobile` (core) + `@sincpro/mobile-odoo` (integración Odoo) + `@sincpro/mobile-ui` (design system) y registra su propio dominio.

> 🤖 **Agentes de IA:** leé [`AGENTS.md`](AGENTS.md) (orientación del ecosistema, patrones) y [`docs/GOTCHAS.md`](docs/GOTCHAS.md) (trampas conocidas).

## Características

- Consume los 3 paquetes del framework **desde el registry** (`dependencies` + `resolutions`); una sola copia de cada (peerDependencies).
- **Sin impresora** (a diferencia de `tickets`): no registra `IPrinterDriver`.
- Tema propio **azul** (`#2563EB`), assets en `assets/DISTRIBUTION/`.
- Composición en `sincpro_mobile_distribution/entrypoints/main.tsx` (`DistributionModule` + `createDistributionApp`).

## Correr

```bash
make init          # instala dependencias + pre-commit
make start         # Expo dev server
make android       # build nativo Android
make prebuild      # regenera android/ios desde app.json (icono/splash)
```

## Calidad

```bash
make format         # auto-fix: eslint --fix + prettier + typecheck
make verify-format  # gate de CI: format + falla si quedó algo (cubre lint + formato + tipos)
```

## Estructura

```
sincpro_mobile_distribution/
  adapters/        adapters Odoo + repositorios (SQLite)
  domain/          subdominios: sale_order, invoice, electronic_invoice,
                   credit_note, payment, product, route, customer, common
  services/        casos de uso (repos vía getters lazy — ver AGENTS.md)
  entrypoints/     main.tsx (composición), db, queue, cron, ui (App, AppRoutes, theme)
  ui/              components + screens de la app
```
