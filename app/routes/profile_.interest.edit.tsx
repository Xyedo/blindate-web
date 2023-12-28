import { redirect } from "@remix-run/node";
import type { DataFunctionArgs, TypedResponse  } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { guard } from "~/api/api";
import { User } from "~/api/user";

export const loader = async (
  args: DataFunctionArgs
): Promise<{ interest: User.Interest } | TypedResponse<never>> => {
  if (process.env?.["APP_ENV"] == "local") {
    return {
      interest: {
        hobbies: ["Ngoding", "Kulineran", "Pacaran"],
        movie_series: ["100 Days", "Spartans"],
        sports: ["Basket", "Futsal"],
        travels: ["Gunung", "Bali", "Singapore"],
      },
    };
  }

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  const userDetail = await User.getDetail(result.token, result.userId);

  return {
    interest: {
      hobbies: userDetail?.hobbies ?? [],
      movie_series: userDetail?.movie_series ?? [],
      sports: userDetail?.sports ?? [],
      travels: userDetail?.travels ?? [],
    },
  };
};
export default function InterestEdit() {
  const data = useLoaderData<typeof loader>()
  if (!data) {
    return null
  }

  const {interest} = data
  return (
    <Form method="PUT">
      
    </Form>
  );
}
