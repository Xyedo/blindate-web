import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs } from "@remix-run/node";
import axios from "axios";
import axiosRetry from "axios-retry";

const getBaseURLV1 = () => {
  if (!process.env?.["API_BASE_URL"]) {
    throw new Error("invalid env");
  }

  return `${process.env?.["API_BASE_URL"]}/v1/`;
};

axiosRetry(axios, { retries: 3 });
export const api = axios.create({
  baseURL: getBaseURLV1(),
});

export async function guard(args: DataFunctionArgs) {
  const { userId, getToken, user } = await getAuth(args);
  if (!userId) {
    return undefined;
  }

  const token = await getToken();
  if (!token) {
    return undefined;
  }

  return { userId, token, user };
}
