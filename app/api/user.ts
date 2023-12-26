import * as v from "valibot";
import { getBaseURLV1 } from "~/api/api";

export namespace User {
  const detail = v.object({
    user_id: v.string(),
    alias: v.string(),
    geo: v.object({ lat: v.string(), lng: v.string() }),
    bio: v.string(),
    gender: v.string(),
    height: v.number(),
    education_level: v.string(),
    drinking: v.string(),
    smoking: v.string(),
    relationship_preferences: v.string(),
    looking_for: v.string(),
    zodiac: v.string(),
    kids: v.number(),
    work: v.string(),
    hobbies: v.array(v.string()),
    movie_series: v.array(v.string()),
    travels: v.array(v.string()),
    sports: v.array(v.string()),
    profile_picture_urls: v.array(v.string()),
  });
  export type Schema = v.Output<typeof detail>;

  export const API = getBaseURLV1() + "/users";

  export async function getDetail(
    token: string,
    userId: string
  ): Promise<Schema | undefined> {
    const resp = await fetch(`${API}/${userId}/detail`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    switch (resp.status) {
      case 404:
        return undefined;
      case 200:
        const { data: userDetail } = await resp.json();
        return v.parse(detail, userDetail);
      default:
        throw new Response("Internal Server error", { status: 500 });
    }
  }
  export const createDetailSchema = v.object({
    alias: v.string(),
    gender: v.picklist(getEnumGender()),
    location: v.optional(
      v.object({
        lat: v.string([]),
        lng: v.string([v.toTrimmed(), v.regex()]),
      })
    ),
  });

  export type CreateDetailSchema = v.Output<typeof createDetailSchema>;

  export async function createDetail(token: string);

  export type GenderEnum = "FEMALE" | "MALE" | "Other";
  export function getEnumGender() {
    return ["FEMALE", "MALE", "Other"] as const;
  }

  export function translateGenderEnumToHuman(gender: GenderEnum): string {
    switch (gender) {
      case "MALE":
        return "Male";
      case "FEMALE":
        return "female";
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
