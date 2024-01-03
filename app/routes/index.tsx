import { redirect } from "@remix-run/node";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import { apiError, guard } from "~/api/api";
import { User } from "~/api/user";

export const meta: MetaFunction = () => {
  return [
    { title: "Blindate" },
    { name: "description", content: "Welcome to Remix!" },
    {},
  ];
};

export const loader: LoaderFunction = async (args) => {
  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }
  //TODO: Get All Conversation, UserDetail, Match
  const userDetail = await User.getDetail(result.token, result.userId).catch(
    (e) => {
      if (!axios.isAxiosError(e)) {
        throw e;
      }

      if (!e.response) {
        throw e;
      }

      const data = apiError.parse(e.response.data);
      if (e.response.status === 404) {
        if (data.errors?.[0].code === "USER_NOT_FOUND") {
          return redirect("/profile/edit");
        }

        throw e;
      }

      if (e.response.status === 401) {
        if (data.errors?.[0].code === "EXPIRED_AUTH") {
          return redirect("/");
        }
        if (
          data.errors?.[0].code &&
          ["INVALID_AUTHORIZATION", "UNAUTHORIZED"].includes(
            data.errors?.[0].code
          )
        ) {
          return redirect("/sign-in");
        }
        throw e;
      }
      throw e;
    }
  );

  return userDetail;
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  if (!data) {
    return null;
  }
  return (
    <div>
      <h1>HELLO TEST</h1>
    </div>
  );
}
