import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { ClerkApp, ClerkErrorBoundary } from "@clerk/remix";
import { ThemeProvider } from "~/context/themeProvider";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

//TODO: add global error  boundaries
export const ErrorBoundary = ClerkErrorBoundary();

export const loader: LoaderFunction = (args) => rootAuthLoader(args);

function App() {
  return (
    <html lang="en">
      <head>
        <title>Blindate Website</title>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <meta
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>
          <Outlet />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default ClerkApp(App);
