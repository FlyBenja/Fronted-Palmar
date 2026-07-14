# Configuración para Netlify

Este frontend ya incluye:

- `public/_redirects` para que React Router funcione en rutas como `/login` y `/cliente`.
- `netlify.toml` con build command y publish directory.
- `.env` con `VITE_API_URL=https://backend-palmar.onrender.com`.

En Netlify usar:

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://backend-palmar.onrender.com`

Si cambias la variable `VITE_API_URL`, debes hacer redeploy para que Vite la incluya en el build.
