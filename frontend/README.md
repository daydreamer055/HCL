# StockSmart frontend

Angular standalone application for the StockSmart retail inventory backend. Feature routes are scaffolded with placeholder pages; business workflows and mock API data have intentionally not been added.

## Run

From this directory:

```powershell
npm start
```

The dev server is available at `http://localhost:4200`. Build with `ng build`.

The API base URL is configured in `src/environments/environment.ts` as `http://localhost:8080/api`.

## Authentication integration

The login form posts `email` and `password` to `POST /auth/login` and expects a JSON response containing an `accessToken`. The token is stored in browser local storage, attached to API requests as a Bearer token, and required by the authentication route guard. Authenticated users visiting `/login` are redirected to `/dashboard`; sign out clears the token.

The current backend must expose this login endpoint and allow cross-origin requests from `http://localhost:4200` for browser-based authentication. No authentication endpoint or fake credentials are implemented in this frontend.

## Structure

- `src/app/core`: app shell, route guard, HTTP interceptors, and singleton services
- `src/app/components`: reusable navbar, sidebar, loading, and notification components
- `src/app/shared`: reusable page-placeholder component
- `src/app/models`: typed API response and request contracts
- `src/app/pages`: login plus routed placeholders for dashboard and management areas
