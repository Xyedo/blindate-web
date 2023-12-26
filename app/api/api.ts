import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs} from "@remix-run/node";

export const getBaseURLV1 = () => {
  if (!process.env?.["API_BASE_URL"]) {
    throw new Error("invalid env");
  }

  return `${process.env?.["API_BASE_URL"]}/v1`;
};



export async function guard(args:DataFunctionArgs) {
  const { userId, getToken } = await getAuth(args);
  if (!userId) {
    return undefined
  }

  const token = await getToken();
  if (!token) {
    return undefined
  }

  return {userId, token}

}