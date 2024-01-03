import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs } from "@remix-run/node";
import axios from "axios";
import axiosRetry from "axios-retry";
import z from "zod";

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

export const apiError = z.object({
  message: z.string().optional(),
  errors: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        details: z.record(z.array(z.string())).nullable(),
      })
    )
    .optional(),
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
