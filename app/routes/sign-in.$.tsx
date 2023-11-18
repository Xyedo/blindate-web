import { SignIn } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs} from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async (args: DataFunctionArgs) => {
  const { userId } = await getAuth(args);
  if (userId) {
    return redirect("/")
  }

  return {}
}
export default function SignInPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignIn />
    </div>
  );
}