import { getAuth } from "@clerk/remix/ssr.server";
import { redirect } from "@remix-run/node";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import axios from "axios";
import { getBaseURLV1 } from "~/api/api";

export const meta: MetaFunction = () => {
  return [
    { title: "Blindate" },
    { name: "description", content: "Welcome to Remix!" },
    { }
  ];
};



const userAPI = getBaseURLV1() + "/users";
export const loader: LoaderFunction = async (args) => {
  if (process.env?.["APP_ENV"] == "local") {
    return {}
  }
  const { userId, getToken } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in");
  }

  const token = await getToken();
  if (!token) {
    return redirect("/sign-in")
  }



  //TODO: Get All Conversation, UserDetail, Match
  const resp = await axios.get(`${userAPI}/${userId}/detail`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  switch (resp.status) {
    case 404:
      return redirect("/profile/edit")
    default:
      const userDetail = await resp.data()
      return userDetail;
  }
};


export default function Index() {
  return (
    <>
     <h1>HELLO TEST</h1> 
    </>
  );
}
