import * as v from "valibot";
export const getBaseURLV1 = () => {
  if (!process.env?.["API_BASE_URL"]) {
    throw new Error("invalid env");
  }

  return `${process.env?.["API_BASE_URL"]}/v1`;
};

export const userSchema = v.object({
  user_id: v.string(),
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
  sports: v.array(v.string())
});
export type UserSchema = v.Output<typeof userSchema>;