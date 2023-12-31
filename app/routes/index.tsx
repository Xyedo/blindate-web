import { redirect } from "@remix-run/node";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { guard } from "~/api/api";
import { User } from "~/api/user";

export const meta: MetaFunction = () => {
  return [
    { title: "Blindate" },
    { name: "description", content: "Welcome to Remix!" },
    {},
  ];
};

export const loader: LoaderFunction = async (args) => {
  const result = await guard(args)
  if (!result) {
    return redirect("/sign-in")
  }
  //TODO: Get All Conversation, UserDetail, Match
  const userDetail = await User.getDetail(result.token, result.userId);
  if (!userDetail) {
    return redirect("/profile/edit")
  }

  return {}
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
