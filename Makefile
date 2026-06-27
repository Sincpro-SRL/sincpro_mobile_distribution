.DEFAULT_GOAL := help

APP := sincpro-mobile-distribution

help:
	@echo "$(APP) — comandos:"
	@echo "  init                       prepare-environment + instala dependencias"
	@echo "  start / web                expo start (dev) / web"
	@echo "  android / ios              expo run:android | run:ios"
	@echo "  prebuild                   expo prebuild (genera ios/android nativos)"
	@echo "  typecheck / lint / check   tsc / eslint / ambos"
	@echo "  verify                     TODOS los guardrails (read-only): lint + tipos + formato"
	@echo "  format / format-check      eslint --fix + prettier (escribe) / sólo valida"
	@echo "  clean                      borra node_modules, .expo, ios, android"

prepare-environment:
	@pipx install pre-commit
	@pipx ensurepath
	@pre-commit install

init: prepare-environment
	@echo "Installing dependencies..."
	@yarn install

start:
	@npx expo start

web:
	@npx expo start --web

android:
	@npx expo run:android

ios:
	@npx expo run:ios

prebuild:
	@npx expo prebuild

typecheck:
	@npx tsc --noEmit

lint:
	@npx eslint .

format:
	@echo "🔤 Ordenando imports + auto-fix (eslint)..."
	@npx eslint . --fix
	@npx prettier --experimental --write "**/*.{ts,tsx,js,jsx,json}" --ignore-path .gitignore
	@$(MAKE) typecheck

doctor:
	@bash scripts/doctor.sh

verify-format: format doctor
	@if ! git diff --quiet; then \
	  echo >&2 "✘ El formateo ha modificado archivos. Por favor agrégalos al commit."; \
	  git --no-pager diff --name-only HEAD -- >&2; \
	  exit 1; \
	fi
	@echo "✓ Format verification passed"	

clean:
	@rm -rf node_modules .expo ios android
	@echo "✓ Cleaned"

.PHONY: help prepare-environment init start web android ios prebuild typecheck lint check verify format format-check clean
