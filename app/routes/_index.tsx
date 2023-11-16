import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/node";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { getBaseURLV1 } from "~/api/api";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};


const userAPI = getBaseURLV1() + "/users";
export const loader: LoaderFunction = async (args) => {
  const { userId, getToken } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in");
  }

  const token = await getToken();
  if (!token) {
    return redirect("/sign-in")
  }

  const controller = new AbortController();
  //TODO: Get All Conversation, UserDetail, Match
  const resp = await fetch(`${userAPI}/${userId}/detail`, {
    signal: controller.signal,
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  switch (resp.status) {
    case 404:
      return redirect("/profile")
    default:
      const userDetail = await resp.json()
      return userDetail;
  }
};


export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
          <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
            Remix Docs
          </a>
        </li>
      </ul>
    </div>
  );
}
