import axios from "axios";
import zod from "zod";
import { getBaseURLV1 } from "~/api/api";

export namespace User {
  const detail = zod.object({
    user_id: zod.string(),
    alias: zod.string(),
    geo: zod.object({ lat: zod.number(), lng: zod.number() }),
    bio: zod.string(),
    gender: zod.string(),
    from_location: zod.string().optional(),
    height: zod.number().optional(),
    education_level: zod.string().optional(),
    drinking: zod.string().optional(),
    smoking: zod.string().optional(),
    relationship_preferences: zod.string().optional(),
    looking_for: zod.string(),
    zodiac: zod.string().optional(),
    kids: zod.number().optional(),
    work: zod.string().optional(),
    hobbies: zod.array(zod.string().optional()),
    movie_series: zod.array(zod.string().optional()),
    travels: zod.array(zod.string().optional()),
    sports: zod.array(zod.string().optional()),
    profile_picture_urls: zod.array(zod.string()),
  });
  export type Schema = zod.infer<typeof detail>;
  export type Interest = Pick<
    Schema,
    "hobbies" | "movie_series" | "sports" | "travels"
  >;
  export const API = getBaseURLV1() + "/users";

  export async function getDetail(
    token: string,
    userId: string
  ): Promise<Schema | undefined> {
    const resp = await axios.get(`${API}/${userId}/detail`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 500,
      responseType: "json",
    });
    switch (resp.status) {
      case 404:
        return undefined;
      case 200:
        const { data: userDetail } = await resp.data();
        const data = detail.parse(userDetail);
        data.gender = translateGenderEnumToHuman(data.gender as GenderEnum);
        return data;

      default:
        throw new Response("Internal Server error", { status: 500 });
    }
  }
  export const createDetailSchema = zod.object({
    alias: zod.string().min(5).max(200),
    gender: zod.enum(getEnumGender()),
    location: zod
      .object({
        lat: zod.coerce.number().min(-90).max(90),
        lng: zod.coerce.number().min(-180).max(180),
      })
      .optional(),
    bio: zod.string().min(2).max(300),
    from_location: zod.string().min(0).max(100).optional(),
    height: zod.coerce.number().max(400).optional(),
    education_level: zod.enum(getEnumEducationLevel()).optional(),
    drinking: zod.enum(getEnumDrinnkingOrSmokeLevel()).optional(),
    smoking: zod.enum(getEnumDrinnkingOrSmokeLevel()).optional(),
    relationship_pref: zod.enum(getEnumRelationshipPrefrence()).optional(),
    looking_for: zod.enum(getEnumGender()),
    zodiac: zod.enum(getEnumZodiac()).optional(),
    kids: zod.coerce.number().max(100).optional(),
    work: zod.coerce.number().min(0).max(50).optional(),
  });

  export type CreateDetailSchema = zod.infer<typeof createDetailSchema>;

  export async function upsertDetail(
    token: string,
    userId: string,
    payload: CreateDetailSchema
  ): Promise<void> {
    const userDetail = createDetailSchema.parse(payload);

    const resp = await axios.patch(`${API}/${userId}/detail`, userDetail, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (resp.status == 404) {
      const resp = await axios.post(`${API}/${userId}/detail`, userDetail, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resp.status >= 400) {
        const errBody = await resp.data();
        throw new Error(errBody);
      }

      return;
    }

    if (resp.status >= 400) {
      const errBody = await resp.data();
      throw new Error(errBody);
    }
  }

  export async function updateInterest() {}
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
      "virgo",
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
      zod.object({
        latitude: zod.coerce.number().min(-90).max(90),
        longitude: zod.coerce.number().min(-180).max(180),
      })
    );
  export type ProfileEditSchema = zod.infer<typeof profileEditSchema>;
}
