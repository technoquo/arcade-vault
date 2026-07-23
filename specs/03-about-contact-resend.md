# SPEC 03 — About Page + Contacto con Resend

> **Status:** Aprobado
> **Depends on:** 02-home-landing
> **Date:** 2026-07-23
> **Objective:** Implementar la página `/about` con la sección "Acerca de" y el formulario
> de contacto que envía correos reales vía Resend al email del equipo.

---

## Scope

**In:**

- `app/about/page.tsx` — Nueva ruta con dos bloques: "Acerca de" (hero + highlights)
  y "Contacto" (formulario + terminal de éxito), portados desde `references/home-about/about.jsx`.
- `app/api/contact/route.ts` — Route Handler (POST) que recibe `{ name, email, msg }`,
  valida que los campos no estén vacíos y llama a Resend para enviar el correo.
- `app/globals.css` — Portar los selectores del About/Contact desde
  `references/home-about/styles.css` que aún no existan.
- `components/Nav.tsx` — Añadir link "Acerca de" apuntando a `/about`.
- `.env.local` — Añadir `RESEND_API_KEY` y `CONTACT_TO_EMAIL`.

**Out of scope:**

- Correo de confirmación al usuario que envía el formulario.
- Validación avanzada de campos (longitud máxima, regex de email, Zod).
- Cambio de dominio `from` a dominio propio verificado.
- Rate limiting o protección anti-spam.
- Tests automatizados.
- Cualquier cambio a rutas existentes fuera de Nav.

---

## Data model

**Request body del formulario (cliente → API):**

```ts
interface ContactPayload {
  name: string;
  email: string;
  msg: string;
}
```

**Variables de entorno (`.env.local`):**

```
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_TO_EMAIL=technoquo@gmail.com
```

No se introducen nuevas tablas, archivos de persistencia ni cambios a `lib/data.ts`.
El formulario no almacena nada — el correo es el único registro del envío.

---

## Implementation plan

1. **`.env.local`** — Añadir las dos variables:
   `RESEND_API_KEY=<tu_key>` y `CONTACT_TO_EMAIL=technoquo@gmail.com`.
   Verificación: el archivo existe y contiene ambas claves.

2. **`npm install resend`** — Instalar el SDK de Resend.
   Verificación: `resend` aparece en `package.json` dependencies.

3. **`app/api/contact/route.ts`** — Crear el Route Handler POST:
   - Parsear el body como `ContactPayload`.
   - Validar que `name`, `email` y `msg` no estén vacíos; devolver `400` si falta alguno.
   - Llamar a `resend.emails.send()` con `from: "onboarding@resend.dev"`,
     `to: process.env.CONTACT_TO_EMAIL`, `subject` y `html` con los datos del formulario.
   - Devolver `200` en éxito o `500` si Resend falla.
   Verificación: `POST /api/contact` con body válido devuelve `200` y llega el correo.

4. **`app/about/page.tsx`** — Crear la página portando `references/home-about/about.jsx` a TSX:
   - Sección "Acerca de": kicker, título, párrafo de misión, tres highlights con sus SVG icons.
   - Divider animado de píxeles.
   - Sección "Contacto": intro con tips, formulario controlado con `useState`.
   - Al submit: validación cliente (campos vacíos → shake), luego `fetch POST /api/contact`.
   - En éxito: mostrar terminal con el nombre del usuario. En error de red/servidor: mostrar
     mensaje de error inline sin ocultar el formulario.
   - `useEffect` con `IntersectionObserver` para las clases `.reveal`.
   Verificación: `/about` renderiza ambas secciones sin errores en consola.

5. **`app/globals.css`** — Portar desde `references/home-about/styles.css` los selectores
   del About que aún no existan: `.about`, `.about-hero`, `.about-title`, `.about-mission`,
   `.highlight-row`, `.highlight`, `.hl-icon`, `.hl-text`, `.about-divider`, `.div-bar`,
   `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`,
   `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`, `.contact-form`, `.shake`,
   `.field`, `.terminal-success`, `.term-bar`, `.term-body`, `.dot`, `.term-title`,
   `.prompt`, `.caret`.
   Verificación: ningún bloque del About aparece sin estilo en el navegador.

6. **`components/Nav.tsx`** — Añadir el link "Acerca de" → `/about` entre "Biblioteca"
   y cualquier otro link existente.
   Verificación: el link aparece en el Nav y se activa al estar en `/about`.

7. **`tsc --noEmit`** — Confirmar que no hay errores de tipo.

---

## Acceptance criteria

- [ ] `/about` renderiza la sección "Acerca de" con kicker, título, misión y los tres
      highlights (HEART, BROWSER, PLANT) con sus íconos SVG pixel-art.
- [ ] El divider animado de píxeles es visible entre las dos secciones.
- [ ] La sección "Contacto" muestra el formulario con los campos NOMBRE,
      CORREO ELECTRÓNICO y MENSAJE.
- [ ] Enviar el formulario con campos vacíos activa la animación `.shake` y no llama a la API.
- [ ] Enviar el formulario con datos válidos llama a `POST /api/contact` y muestra
      la terminal de éxito con el nombre del usuario en mayúsculas.
- [ ] El botón "ENVIAR OTRO MENSAJE" resetea el formulario y vuelve al estado inicial.
- [ ] El correo llega a `technoquo@gmail.com` con nombre, email y mensaje del remitente.
- [ ] Si la API devuelve error, el formulario muestra un mensaje de error inline
      sin ocultarse.
- [ ] Las secciones con `.reveal` se animan al entrar en el viewport al hacer scroll.
- [ ] El Nav muestra el link "Acerca de" y lo marca activo al estar en `/about`.
- [ ] `tsc --noEmit` pasa sin errores de tipo.

---

## Decisions

- **Sí:** `app/api/contact/route.ts` como Route Handler del App Router.
  Consistente con la arquitectura del proyecto; Pages Router está descartado.

- **Sí:** `from: "onboarding@resend.dev"` (sandbox de Resend).
  No requiere dominio propio verificado; suficiente para MVP.
  Cuando haya un dominio verificado, se cambia solo esta línea.

- **No:** Correo de confirmación al remitente.
  Añade complejidad (template extra, posible spam) sin valor inmediato en esta etapa.

- **Sí:** Validación de campos vacíos solo en cliente y servidor.
  Mínimo necesario para el MVP; Zod o validación avanzada queda para un spec futuro.

- **No:** Rate limiting ni protección anti-spam.
  Fuera del alcance del MVP; se aborda cuando el formulario sea público en producción.

- **Sí:** `CONTACT_TO_EMAIL` como variable de entorno en lugar de hardcodear el email.
  Permite cambiar el destinatario sin tocar el código.

---

## Risks

| Riesgo | Mitigación |
|--------|------------|
| El sandbox de Resend (`onboarding@resend.dev`) solo puede enviar a la dirección de email verificada de la cuenta Resend. Si `technoquo@gmail.com` no es el email de la cuenta, el envío fallará silenciosamente. | Verificar que el email de la cuenta Resend coincide con `CONTACT_TO_EMAIL`, o verificar el email destino en el dashboard de Resend antes de probar. |
| `RESEND_API_KEY` ausente en entorno de producción (Vercel u otro). | Añadir la variable en el panel de entorno del proveedor de deploy antes de hacer push a producción. |
| Selectores CSS del About ya existen parcialmente en `globals.css` con estilos distintos. | Antes de añadir cada selector, buscarlo con grep; actualizar en lugar de duplicar. |
