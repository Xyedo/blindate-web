import { api } from "~/api/api";
import z from "zod";
import { User } from "~/api/user";

export namespace Match {
  const matchSchema = z
    .object({
      id: z.string(),
      distance: z.number(),
    })
    .and(User.detail);

  const matchSchemaWithStatus = z
  .object({
    status: z.enum(["likes", "accepted"]),
  })
  .and(matchSchema);

  export type MatchSchemaWithStatus = z.infer<typeof matchSchemaWithStatus>;
  const indexSchema = z.object({
    metadata: z.object({
      prev: z.string().nullable(),
      next: z.string().nullable(),
    }),
    data: z.array(matchSchema.optional()),
  });

  export type IndexSchema = z.infer<typeof indexSchema>;
  export type Status = "candidate" | "likes" | "accepted";

  export async function indexOrInsertCandidateIfEmpty(
    token: string,
    pagination?: { page: number; limit: number }
  ): Promise<IndexSchema> {
    const list = await index(token, "candidate", pagination);
    if (list.data.length) return list;

    await create(token);

    return index(token, "candidate", pagination);
  }

  export async function index(
    token: string,
    status: Status,
    pagination?: { page: number; limit: number }
  ): Promise<IndexSchema> {
    const { data } = await api.get<IndexSchema>("matchs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: pagination?.page ?? 1,
        limit: pagination?.limit ?? 10,
        status,
      },
    });

    return indexSchema.parse(data);
  }

  export async function get(token: string, id: string): Promise<MatchSchemaWithStatus> {
    const { data: resp } = await api.get<{ data: MatchSchemaWithStatus }>(
      `matchs/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return matchSchemaWithStatus.parse(resp.data);
  }

  async function create(token: string): Promise<void> {
    await api.post("matchs", undefined, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  const transition = z.object({
    swipe: z.coerce.boolean(),
  });

  export async function swipe(
    token: string,
    matchId: string,
    payload: unknown
  ): Promise<void> {
    await api.put<{ data: { accepted: boolean } }>(
      `matchs/${matchId}/request-transition`,
      transition.parse(payload),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}

export namespace MatchForm {
  export const swipeSchema = z.object({
    matchId: z.string(),
    swipe: z.coerce.boolean(),
  });

  export type SwipeSchema = z.infer<typeof swipeSchema>;
  export type SwipeSchemaError = z.inferFlattenedErrors<typeof swipeSchema>;
}
