# SPEC 04 — Supabase Auth

> **Status:** Aprobado
> **Depends on:** 03-about-contact-resend
> **Date:** 2026-07-24
> **Objective:** Integrar Supabase Auth en Arcade Vault para permitir
> registro e inicio de sesión por email/contraseña y OAuth (Google y GitHub),
> implementando `/auth` como página con tabs y actualizando el Nav para
> reflejar el estado de sesión del usuario.

---

## Scope

**In:**

- `.env.local` — Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase/client.ts` — Cliente de Supabase para el navegador (componentes cliente).
- `lib/supabase/server.ts` — Cliente de Supabase para Server Components y Route Handlers.
- `middleware.ts` — Refresco automático de sesión en cada request con `@supabase/ssr`.
- `app/auth/page.tsx` — Página con dos tabs: "Iniciar sesión" y "Registrarse".
  Formulario de email/contraseña + botones de OAuth (Google y GitHub).
- `components/Nav.tsx` — Mostrar inicial/avatar del usuario y botón "Cerrar sesión"
  cuando hay sesión activa; mantener link "Acceder" → `/auth` cuando no la hay.

**Out of scope:**

- Creación del proyecto en Supabase y configuración de credenciales en el dashboard
  (URL, anon key, proveedores OAuth).
- Tabla `profiles` y cualquier dato adicional del usuario más allá de `auth.users`.
- Protección de rutas (middleware que bloquee páginas a usuarios no autenticados).
- Recuperación de contraseña / magic links.
- Realtime y Edge Functions (specs futuros).
- Tests automatizados.

---

## Data model

No se introducen tablas nuevas en este spec. Supabase gestiona los usuarios
en `auth.users` automáticamente al registrarse.

**Variables de entorno (`.env.local`):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

**Tipo de sesión (inferido de `@supabase/ssr`, sin definir manualmente):**

```ts
// El hook useUser() / getUser() devuelve este shape de Supabase
interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>; // incluye avatar_url en OAuth
}
```

**Dependencias nuevas (`package.json`):**

```
@supabase/supabase-js
@supabase/ssr
```

---

## Implementation plan

1. **Instalar dependencias** — `npm install @supabase/supabase-js @supabase/ssr`.
   Verificación: ambos paquetes aparecen en `package.json`.

2. **`.env.local`** — Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   con los valores del dashboard de Supabase.
   Verificación: el archivo contiene ambas variables.

3. **`lib/supabase/client.ts`** — Crear el cliente browser con `createBrowserClient`
   de `@supabase/ssr`. Exportar como `createClient()`.
   Verificación: importable desde componentes cliente sin errores de tipo.

4. **`lib/supabase/server.ts`** — Crear el cliente server con `createServerClient`
   de `@supabase/ssr`, leyendo y escribiendo cookies via `next/headers`.
   Exportar como `createClient()`.
   Verificación: importable desde Server Components y Route Handlers.

5. **`middleware.ts`** — Crear (o actualizar si existe) el middleware de Next.js
   que refresca la sesión en cada request usando `createServerClient`.
   El `matcher` excluye `_next/static`, `_next/image` y `favicon.ico`.
   Verificación: la sesión persiste al navegar entre páginas sin re-login.

6. **`app/auth/page.tsx`** — Implementar la página de auth como Client Component:
   - Dos tabs: "Iniciar sesión" / "Registrarse" con estado local `activeTab`.
   - Formulario controlado con `email` y `password` (+ `confirmPassword` en registro).
   - Al submit: llamar a `supabase.auth.signInWithPassword()` o `signUp()` según el tab.
   - En éxito de login: `router.push("/juegos")`. En éxito de registro: mostrar mensaje
     "Revisa tu correo para confirmar tu cuenta".
   - Botones OAuth: `supabase.auth.signInWithOAuth({ provider: "google" | "github" })`.
   - En error: mostrar mensaje inline bajo el formulario.
     Verificación: login con email/password funciona y redirige a `/juegos`.

7. **`app/auth/callback/route.ts`** — Crear Route Handler GET que intercambia el
   `code` de OAuth por una sesión usando `supabase.auth.exchangeCodeForSession(code)`,
   luego redirige a `/juegos`.
   Verificación: el flujo OAuth completo (Google o GitHub) termina en `/juegos`.

8. **`components/Nav.tsx`** — Leer la sesión del usuario desde el servidor con
   `createClient()` de `lib/supabase/server.ts`. Si hay sesión: mostrar inicial
   del email en un círculo + botón "Cerrar sesión" que llama a un Server Action
   `signOut()` el cual ejecuta `supabase.auth.signOut()` y redirige a `/`.
   Si no hay sesión: mantener el link "Acceder" → `/auth`.
   Verificación: el Nav refleja el estado correcto en ambos estados.

9. **`tsc --noEmit`** — Confirmar que no hay errores de tipo.
   Verificación: 0 errores.

---

## Acceptance criteria

- [ ] Un usuario nuevo puede registrarse con email y contraseña desde `/auth`.
- [ ] Tras registrarse, se muestra el mensaje "Revisa tu correo para confirmar tu cuenta".
- [ ] Un usuario registrado puede iniciar sesión con email y contraseña.
- [ ] Tras iniciar sesión con email/contraseña, se redirige a `/juegos`.
- [ ] El botón "Continuar con Google" inicia el flujo OAuth y termina en `/juegos`.
- [ ] El botón "Continuar con GitHub" inicia el flujo OAuth y termina en `/juegos`.
- [ ] Si el login falla (contraseña incorrecta, email no existe), se muestra un
      mensaje de error inline sin recargar la página.
- [ ] El Nav muestra la inicial del email del usuario en un círculo cuando hay sesión activa.
- [ ] El botón "Cerrar sesión" en el Nav cierra la sesión y redirige a `/`.
- [ ] Tras cerrar sesión, el Nav vuelve a mostrar el link "Acceder" → `/auth`.
- [ ] Ninguna ruta existente queda bloqueada para usuarios no autenticados.
- [ ] La sesión persiste al recargar la página (no requiere re-login).
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** `@supabase/ssr` en lugar del paquete deprecado `@supabase/auth-helpers-nextjs`.
  Es el paquete oficial para Next.js App Router; soporta Server Components, middleware
  y Route Handlers correctamente.

- **Sí:** Una sola página `/auth` con tabs en lugar de rutas separadas `/auth/login`
  y `/auth/register`. Reduce la superficie de archivos y es suficiente para el MVP.

- **Sí:** `app/auth/callback/route.ts` como Route Handler dedicado para el intercambio
  del código OAuth. Es el flujo que requiere Supabase para el PKCE flow en App Router.

- **Sí:** El Nav lee la sesión desde el servidor (Server Component) para evitar
  flash de contenido no autenticado al cargar la página.

- **No:** Tabla `profiles` en este spec. Solo se usa `auth.users`; los datos de
  perfil extendidos (username, avatar personalizado) se añaden cuando el spec
  de scores los necesite.

- **No:** Protección de rutas en el middleware. Ninguna ruta del MVP actual requiere
  autenticación obligatoria; se añade cuando se implemente el perfil o scores privados.

- **No:** Magic links ni recuperación de contraseña. Fuera del alcance del MVP;
  se aborda en un spec futuro de "configuración de cuenta".

- **No:** Realtime y Edge Functions. Confirmado por el usuario como specs futuros
  independientes.

---

## Risks

| Riesgo                                                                                                                                                                                                               | Mitigación                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los proveedores OAuth (Google, GitHub) necesitan URLs de callback configuradas en el dashboard de Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`) y en la consola de cada proveedor antes de probar. | Documentar los pasos de configuración en el PR; el spec de impl los incluirá como paso previo.                                                           |
| Si `middleware.ts` ya existe (p.ej. de i18n u otro uso), el nuevo código de refresco de sesión debe integrarse sin reemplazarlo.                                                                                     | Verificar existencia del archivo antes de crear; integrar en lugar de sobreescribir.                                                                     |
| El modo de confirmación por email de Supabase puede estar activo por defecto, lo que impide login inmediato tras registro.                                                                                           | Verificar en el dashboard de Supabase (`Authentication → Settings → Enable email confirmations`) y comunicarlo al usuario si interfiere con las pruebas. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` expuesta en el cliente es intencional pero debe ser la clave `anon`, nunca la `service_role`.                                                                                        | Confirmar que la variable usa la clave correcta antes del primer deploy.                                                                                 |
