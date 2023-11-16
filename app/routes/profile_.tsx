import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type { UserSchema } from "~/api/api";
import { getBaseURLV1, userSchema } from "~/api/api";
import * as v from "valibot";

const userAPI = getBaseURLV1() + "/users";
export const loader = async (
  args: DataFunctionArgs
): Promise<UserSchema | TypedResponse<never>> => {
  const { userId, getToken } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in");
  }

  const token = await getToken();
  if (!token) {
    return redirect("/sign-in");
  }

  const resp = await fetch(`${userAPI}/${userId}/detail`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  switch (resp.status) {
    case 404:
      return redirect("/profile/edit");
    default:
      const { data: userDetail } = await resp.json();
      return v.parse(userSchema, userDetail);
  }
};

export default function Profile() {
  const userDetail = useLoaderData<typeof loader>();
  return <div>
    <div>
      img
    </div>
  </div>;
}
