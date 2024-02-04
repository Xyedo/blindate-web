import { json } from "@remix-run/node";
import type { AxiosResponse } from "axios";
import axios from "axios";
import z from "zod";
import { api } from "~/api/api";

export namespace User {
  export const detail = z.object({
    user_id: z.string(),
    alias: z.string(),
    geo: z.object({ lat: z.number(), lng: z.number() }),
    bio: z.string(),
    gender: z.string(),
    from_location: z.string().nullable(),
    height: z.number().nullable(),
    education_level: z.string().nullable(),
    drinking: z.string().nullable(),
    smoking: z.string().nullable(),
    relationship_preferences: z.string().nullable(),
    looking_for: z.string(),
    zodiac: z.string().nullable(),
    kids: z.number().nullable(),
    work: z.string().nullable(),
    hobbies: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional()
    ),
    movie_series: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional()
    ),
    travels: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional()
    ),
    sports: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional()
    ),
    profile_picture_urls: z.array(z.string()),
  });
  export type Schema = z.infer<typeof detail>;
  export type Interest = Pick<
    Schema,
    "hobbies" | "movie_series" | "sports" | "travels"
  >;

  export async function getDetail(
    token: string,
    userId: string
  ): Promise<Schema> {
    const resp = await api.get(`users/${userId}/detail`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    switch (resp.status) {
      case 200:
        const { data: userDetail } = resp.data;
        const data = detail.parse(userDetail);
        data.gender = translateGenderEnumToHuman(data.gender as GenderEnum);
        data.looking_for = translateGenderEnumToHuman(
          data.gender as GenderEnum
        );

        return data;

      default:
        throw json(resp.data, {
          status: 500,
          statusText: "internal server error",
        });
    }
  }
  export const createDetailSchema = z.object({
    alias: z.string().min(5).max(200),
    gender: z.enum(getEnumGender()),
    location: z
      .object({
        lat: z.coerce.number().min(-90).max(90),
        lng: z.coerce.number().min(-180).max(180),
      })
      .optional(),
    bio: z.string().min(2).max(300),
    from_location: z.string().min(0).max(100).optional(),
    height: z.coerce.number().max(400).optional(),
    education_level: z.enum(getEnumEducationLevel()).optional(),
    drinking: z.enum(getEnumDrinnkingOrSmokeLevel()).optional(),
    smoking: z.enum(getEnumDrinnkingOrSmokeLevel()).optional(),
    relationship_pref: z.enum(getEnumRelationshipPrefrence()).optional(),
    looking_for: z.enum(getEnumGender()),
    zodiac: z.enum(getEnumZodiac()).optional(),
    kids: z.coerce.number().max(100).optional(),
    work: z.string().min(0).max(50).optional(),
  });

  type CreateDetailSchema = z.infer<typeof createDetailSchema>;

  export async function upsertDetail(
    token: string,
    userId: string,
    payload: CreateDetailSchema
  ): Promise<void> {
    const userDetail = createDetailSchema.parse(payload);
    console.log(userDetail)

    await api
      .patch(`users/${userId}/detail`, userDetail, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .catch(async (error) => {
        if (!axios.isAxiosError(error)) {
          throw error;
        }
        
        if (!error.response) {
          throw error;
        }

        if (error.response.status != 404) {
          throw error;
        }
        
        await api.post(`users/${userId}/detail`, userDetail, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      });
  }

  const createInterest = z.object({
    hobbies: z.array(z.string()).optional(),
    movie_series: z.array(z.string()).optional(),
    sports: z.array(z.string()).optional(),
    travels: z.array(z.string()).optional(),
  });

  export type CreateInterest = z.infer<typeof createInterest>;

  const patchInterest = z.object({
    hobbies: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
    movie_series: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .optional(),
    sports: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
    travels: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  });

  export type PatchInterest = z.infer<typeof patchInterest>;

  const deleteInterest = z.object({
    hobbie_ids: z.array(z.string()).optional(),
    movie_serie_ids: z.array(z.string()).optional(),
    sport_ids: z.array(z.string()).optional(),
    travel_ids: z.array(z.string()).optional(),
  });

  export type DeleteInterest = z.infer<typeof deleteInterest>;
  export async function editInterest(
    token: string,
    userId: string,
    payload: {
      create: CreateInterest;
      update: PatchInterest;
      delete: DeleteInterest;
    }
  ): Promise<void> {
    const deletePayload = deleteInterest.parse(payload.delete);
    if (
      deletePayload.hobbie_ids !== undefined ||
      deletePayload.movie_serie_ids !== undefined ||
      deletePayload.sport_ids !== undefined ||
      deletePayload.travel_ids !== undefined
    ) {
      await api.post(`users/${userId}/detail/interest/delete`, deletePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    const bulk: Promise<AxiosResponse>[] = [];

    const createPayload = createInterest.parse(payload.create);
    if (
      createPayload.hobbies !== undefined ||
      createPayload.movie_series !== undefined ||
      createPayload.sports !== undefined ||
      createPayload.travels !== undefined
    ) {
      bulk.push(
        api.post(`users/${userId}/detail/interest`, createPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
    }
    const patchPayload = patchInterest.parse(payload.update);
    if (
      patchPayload.hobbies !== undefined ||
      patchPayload.movie_series !== undefined ||
      patchPayload.sports !== undefined ||
      patchPayload.travels !== undefined
    ) {
      bulk.push(
        api.patch(`users/${userId}/detail/interest`, patchPayload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
    }
    await Promise.all(bulk);
  }

  export type GenderEnum = "FEMALE" | "MALE" | "Other";
  export function getEnumGender() {
    return ["FEMALE", "MALE", "Other"] as const;
  }

  export function translateGenderEnumToHuman(gender: GenderEnum) {
    switch (gender) {
      case "MALE":
        return "Male";
      case "FEMALE":
        return "Female";
      default:
        return gender;
    }
  }

  export function translateToEnum(gender: string): GenderEnum {
    switch (gender) {
      case "Male":
        return "MALE";
      case "Female":
        return "FEMALE";
      default:
        return "Other";
    }
  }

  export function getEnumEducationLevel() {
    return [
      "Less than high school diploma",
      "High school",
      "Some college, no degree",
      "Assosiate''s Degree",
      "Bachelor''s Degree",
      "Master''s Degree",
      "Professional Degree",
      "Doctorate Degree",
    ] as const;
  }

  export function getEnumDrinnkingOrSmokeLevel() {
    return [
      "Never",
      "Ocassionally",
      "Once a week",
      "More than 2/3 times a week",
      "Every day",
    ] as const;
  }

  export function getEnumRelationshipPrefrence() {
    return ["One night Stand", "Casual", "Serious"] as const;
  }

  export function getEnumZodiac() {
    return [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ] as const;
  }
}

export namespace UserForm {
  export const profileEditSchema = User.createDetailSchema
    .omit({ location: true })
    .and(
      z.object({
        latitude: z.coerce.number().min(-90).max(90),
        longitude: z.coerce.number().min(-180).max(180),
      })
    );
  export type ProfileEditSchema = z.infer<typeof profileEditSchema>;
  export type ProfileEditSchemaError = z.inferFlattenedErrors<
    typeof profileEditSchema
  >;
  export const interestEditSchema = z
    .object({
      hobbies: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      new_hobbies: z.array(z.string()).optional(),
      deleted_hobbies: z.array(z.string()).optional(),
      movie_series: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      new_movie_series: z.array(z.string()).optional(),
      deleted_movie_series: z.array(z.string()).optional(),
      sports: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      new_sports: z.array(z.string()).optional(),
      deleted_sports: z.array(z.string()).optional(),
      travels: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      new_travels: z.array(z.string()).optional(),
      deleted_travels: z.array(z.string()).optional(),
    })
    .superRefine((form, ctx) => {
      function interestRefine(
        new_values: { data: string[] | undefined; path: string },
        values: {
          data: { id: string; name: string }[] | undefined;
          path: string;
        }
      ) {
        const uniqueValues = new Set<string>();
        values.data?.forEach((v, idx) => {
          if (!v) {
            return;
          }

          if (uniqueValues.has(v.name)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `No duplicates allowed.`,
              path: [values.path, idx, "name"],
            });
          } else {
            uniqueValues.add(v.name);
          }
        });
        new_values.data?.forEach((v, idx) => {
          if (!v) {
            return;
          }

          if (uniqueValues.has(v)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `No duplicates allowed.`,
              path: [new_values.path, idx],
            });
          } else {
            uniqueValues.add(v);
          }
        });

        if (uniqueValues.size > 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: 10,
            inclusive: true,
            type: "number",
          });
        }
      }

      interestRefine(
        { data: form.new_hobbies, path: "new_hobbies" },
        { data: form.hobbies, path: "hobbies" }
      );
      interestRefine(
        { data: form.new_movie_series, path: "new_movie_series" },
        { data: form.movie_series, path: "movie_series" }
      );
      interestRefine(
        { data: form.new_sports, path: "new_sports" },
        { data: form.sports, path: "sports" }
      );
      interestRefine(
        { data: form.new_travels, path: "new_travels" },
        { data: form.travels, path: "travels" }
      );
    });

  export type InterestEditSchema = z.infer<typeof interestEditSchema>;
  export type InterestEditSchemaError = z.inferFormattedError<
    typeof interestEditSchema
  >;
}
