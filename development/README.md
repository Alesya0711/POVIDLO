# Материалы для разработки

В этом каталоге находятся документы, снимки API, инструменты и вспомогательные материалы. Он не нужен для запуска единого приложения.

## Что входит в приложение

- Интерфейс: `src/`; стили и токены интерфейса: `src/tokens.css` и `src/styles.css`.
- Сервер: `kapibank-backend/app/`, миграции `kapibank-backend/alembic/`, зависимости в `kapibank-backend/requirements.txt` и точка запуска `kapibank-backend/entrypoint.sh`.
- Изображения маскота, которые используются интерфейсом: `assets/mascot/`.
- Тексты лицензий для поставляемых компонентов: `public/licenses/`.

Корневой `Dockerfile` собирает единый образ приложения. Отдельные Docker-файлы в `development/docker/` предназначены для работы с интерфейсом или сервером по отдельности; для их сборки нужен корень проекта в качестве контекста.

## Разработка интерфейса

Используйте версию Node.js из `.nvmrc` - 24.21.0. В корне проекта установите зависимости и запустите Vite:

```sh
cp development/config/frontend.env.example .env.local
npm ci
npm run dev
```

Интерфейс будет доступен по адресу `http://127.0.0.1:5173`. Vite перенаправляет запросы `/api` на сервер по адресу `http://127.0.0.1:8000`. Если сервер слушает другой адрес, задайте его в корневом `.env.local` через `API_PROXY_TARGET`.

## Разработка сервера

Нужны Python 3.12 и доступный PostgreSQL. Настройки соединения задаются в `kapibank-backend/.env`; шаблон находится рядом. Команды запускайте из каталога сервера:

```sh
cd kapibank-backend
cp .env.example .env
python3.12 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Перед миграцией запустите PostgreSQL с параметрами из `.env`. Для работы помощника без внешней модели укажите `LLM_MODE=stub`. Для режима Groq задайте `GROQ_API_KEY` в этом же файле. Корневой `.env.runtime` используется единым Docker-контейнером; локальный Python-процесс его не читает.

Ручной запрос к Groq отправляется из каталога `kapibank-backend/` после настройки ключа:

```sh
python ../development/tools/check_groq.py --case amount
```

Скрипт использует только синтетические примеры. Он не входит в единый образ и не проверяет качество ответов без ключа и живого запроса.

## Состав development/

| Путь | Назначение |
| --- | --- |
| `development/docs/` | Документация помощника |
| `development/design/` | Палитра, решения по интерфейсу и отчёты контраста |
| `development/mascot/` | Концепт маскота и исходные текстовые запросы для иллюстраций |
| `development/api/` | Снимки OpenAPI и коллекция Postman |
| `development/tests/` | Тесты интерфейса и сервера |
| `development/tools/` | Скрипт ручного запроса к Groq, инструменты палитры и вспомогательные сценарии |
| `development/archive/` | Архивные материалы, не используемые приложением |

Проверки палитры запускаются из корня проекта; они устанавливают отдельные зависимости и сохраняют отчёт в `development/design/`:

```sh
npm ci --prefix development/tools/palette
node development/tools/palette/check.mjs
```

Снимки API в `development/api/` служат материалами разработки. Рабочий серверный контракт реализован в `kapibank-backend/app/`.

