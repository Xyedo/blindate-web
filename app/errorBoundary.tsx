import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import axios from "axios";

export function BlindateErrorBoundary() {
  const err = useRouteError();

  if (isRouteErrorResponse(err)) {
    return (
      <div>
        <h1>
          {err.status} {err.statusText}
        </h1>
        <p>data: {err.data}</p>
      </div>
    );
  }
  if (err instanceof Error) {
    if (axios.isAxiosError(err)) {
      if (err.response) {
        return (
          <div>
            <h1>
              {err.response.status} {err.response.statusText}
            </h1>
            <p>data: {err.response.data}</p>
          </div>
        );
      }
      if (err.request) {
        return (
          <div>
            <h1>Invalid request</h1>
            <p>data: {err.request}</p>
          </div>
        );
      }
      return (
        <div>
          <h1>Unknown Error</h1>
          <p>data: {err.message}</p>
        </div>
      );
    }
    return (
      <div>
        <h1>Error</h1>
        <p>{err.message}</p>
        <p>The stack trace is:</p>
        <pre>{err.stack}</pre>
      </div>
    );
  }

  return <h1>Unknown error</h1>;
}
