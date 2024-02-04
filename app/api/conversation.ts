import z from "zod";
import { api } from "~/api/api";

export namespace Conversation {
  export const index = z.object({
    metadata: z.object({
      prev: z.string().nullable(),
      next: z.string().nullable(),
    }),
    data: z.array(
      z
        .object({
          id: z.string(),
          recepient: z.object({
            id: z.string(),
            display_name: z.string(),
            url: z.string(),
          }),
          chat_rows: z.number().int(),
          day_pass: z.number().int(),
          last_chat: z.object({
            id: z.string().nullable(),
            author: z.string().nullable(),
            message: z.string().nullable(),
            unread_message_count: z.number().int().nullable(),
            reply_to: z.string().nullable(),
            sent_at: z.coerce.date().nullable(),
            seen_at: z.coerce.date().nullable(),
            updated_at: z.coerce.date().nullable(),
          }),
          updated_at: z.coerce.date(),
          created_at: z.coerce.date(),
        })
        .optional()
    ),
  });

  export type Index = z.infer<typeof index>;
  export async function list(
    token: string,
    pagination?: { page: number; limit: number }
  ): Promise<Index> {
    const { data } = await api.get<Index>("conversations", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
      },
    });

    return index.parse(data);
  }
}
