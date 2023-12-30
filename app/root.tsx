import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";

import stylesheet from "~/tailwind.css";
import { rootAuthLoader } from "@clerk/remix/ssr.server";
import { ClerkApp, ClerkErrorBoundary } from "@clerk/remix";
import { ThemeProvider } from "~/context/themeProvider";
import { useWindowSize } from "~/hook/useWindowSize";
import { TbHome } from "react-icons/tb/index.js";
import { CgProfile } from "react-icons/cg/index.js";
import { PiHandSwipeRight } from "react-icons/pi/index.js";
import clsx from "clsx";
import { IconContext } from "react-icons";
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

// export const meta: MetaFunction = () => [
//   {
//     name: "viewport",
//     content: "viewport-fit=cover",
//   },
// ];

//TODO: add global error  boundaries
export const ErrorBoundary = ClerkErrorBoundary();

export const loader: LoaderFunction = (args) => rootAuthLoader(args);

function App() {
  return (
    <html lang="en">
      <head>
        <title>Blindate Website</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>
          <>
            <Outlet />
            <MobileNavigation />
          </>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

function MobileNavigation() {
  const location = useLocation();
  console.log(location);
  const size = useWindowSize();
  if (!size || size.width >= 1024) {
    return null;
  }
  return (
    <div className="btm-nav sticky">
      <Form
        action="/"
        className={clsx(location.pathname === "/" ? "active" : undefined)}
      >
        <button type="submit">
          <IconContext.Provider
            value={{ color: "white", className: "h-6 w-6" }}
          >
            <TbHome />
          </IconContext.Provider>
        </button>
      </Form>
      <Form
        action="/match"
        className={location.pathname === "/match" ? "active" : undefined}
      >
        <button type="submit">
          <IconContext.Provider
            value={{ color: "white", className: "h-6 w-6" }}
          >
            <PiHandSwipeRight />
          </IconContext.Provider>
        </button>
      </Form>
      <Form
        action="/profile"
        className={location.pathname === "/profile" ? "active" : undefined}
      >
        <button type="submit">
          <IconContext.Provider
            value={{ color: "white", className: "h-6 w-6" }}
          >
            <CgProfile />
          </IconContext.Provider>
        </button>
      </Form>
    </div>
  );
}

export default ClerkApp(App);
