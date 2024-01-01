import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { AxiosError } from "axios";

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
  } else if (err instanceof AxiosError) {
    if (err.response) {
      return (
        <div>
          <h1>
            {err.response.status} {err.response.statusText}
          </h1>
          <p>data: {err.response.data}</p>
        </div>
      );
    } else if (err.request) {
      return (
        <div>
          <h1>Invalid request</h1>
          <p>data: {err.request}</p>
        </div>
      );
    } else {
      return (
        <div>
          <h1>Unknown Error</h1>
          <p>data: {err.message}</p>
        </div>
      );
    }
  } else if (err instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{err.message}</p>
        <p>The stack trace is:</p>
        <pre>{err.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown error</h1>;
  }
}
