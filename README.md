# 💬 EmojiChat — Guía de instalación

Chat grupal de solo emojis, en tiempo real, con Supabase.

---

## ¿Qué necesitás?

- Una cuenta gratis en [supabase.com](https://supabase.com)
- Los 3 archivos del proyecto: `index.html`, `style.css`, `app.js`

---

## Paso 1 — Crear tu proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta (gratis)
2. Hacé clic en **New project**
3. Elegí un nombre (ej: `emojichat`) y una contraseña para la base de datos
4. Esperá ~2 minutos a que se cree el proyecto

---

## Paso 2 — Crear la tabla de mensajes

1. En tu proyecto de Supabase, andá al menú **SQL Editor**
2. Hacé clic en **New query**
3. Pegá y ejecutá este SQL:

```sql
create table messages (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  avatar text not null,
  emojis text not null,
  created_at timestamptz default now()
);

-- Habilitar seguridad
alter table messages enable row level security;

-- Permitir leer a todos
create policy "Anyone can read"
  on messages for select using (true);

-- Permitir escribir a todos
create policy "Anyone can insert"
  on messages for insert with check (true);
```

4. Hacé clic en **Run** (ícono ▶️)

---

## Paso 3 — Copiar tus credenciales

1. Andá a **Project Settings** (ícono ⚙️ en el menú izquierdo)
2. Hacé clic en **API**
3. Copiá:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → un texto largo que empieza con `eyJ...`

---

## Paso 4 — Configurar la app

Cuando abras `index.html` en el navegador, vas a ver un link "ver guía" debajo del botón de entrada. Hacé clic ahí, pegá tu URL y tu key, y guardá.

¡Listo! Ya podés chatear en tiempo real desde cualquier dispositivo.

---

## Paso 5 — Compartir con amigos (opcional)

Para que otros puedan entrar desde sus celulares, tenés dos opciones:

### Opción A — GitHub Pages (gratis, recomendado)

1. Creá una cuenta en [github.com](https://github.com)
2. Creá un repositorio nuevo llamado `emojichat`
3. Subí los 3 archivos (`index.html`, `style.css`, `app.js`)
4. Andá a **Settings → Pages → Source** y elegí la rama `main`
5. En unos segundos tenés una URL pública como `https://tuusuario.github.io/emojichat`

### Opción B — Netlify Drop (sin cuenta, 1 minuto)

1. Andá a [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arrastrá la carpeta con los 3 archivos
3. Netlify te da una URL pública al instante

---

## ¿Cómo funciona por dentro?

```
Celular A                    Supabase                    Celular B
   │                            │                            │
   │──── envía emoji ─────────►│                            │
   │                            │──── guarda en DB ────────►│
   │                            │──── broadcast ────────────►│
   │                            │                         aparece
   │                         el emoji                   el emoji
```

- **WebSocket**: Supabase mantiene una conexión abierta con cada cliente
- **Realtime**: Cada INSERT en la tabla dispara un evento a todos los conectados
- **Presencia**: Supabase trackea quién está conectado en este momento

---

## Estructura del proyecto

```
emojichat/
├── index.html   ← estructura de la app (3 pantallas)
├── style.css    ← diseño oscuro, responsive
└── app.js       ← lógica del chat + conexión con Supabase
```

---

## Problemas comunes

| Problema | Solución |
|---|---|
| "Error de conexión" | Revisá que la URL y la key estén bien pegadas |
| Los mensajes no llegan | Verificá que creaste las policies de Row Level Security |
| La app se ve rara en el celular | Abrí desde un servidor local o desde GitHub Pages, no desde el archivo directamente |

---

Hecho con 💜 y solo emojis.
