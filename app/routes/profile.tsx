import type { DataFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { guard } from "~/api/api";
import { User } from "~/api/user";

export const loader = async (
  args: DataFunctionArgs
): Promise<User.Schema | null> => {
  if (process.env?.["APP_ENV"] == "local") {
    return {
      alias: "admin",
      bio: "testing 1",
      drinking: "Ocasionnally",
      education_level: "B",
    } as User.Schema;
  }

  const result = await guard(args);
  if (!result) {
    redirect("/sign-in");
    return null;
  }

  const { userId, token } = result;

  const userDetail = await User.getDetail(token, userId);
  if (!userDetail) {
    redirect("/profile/edit");
    return null;
  }

  return userDetail;
};

export default function Profile() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userDetail = useLoaderData<typeof loader>();
  return (
<div className="m-8">
      {/* TODO: handle left and right swipe on photos */}
      <div>
        <p className="mb-4">Avatar</p>
        <div className="avatar">
          <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
            {userDetail && userDetail.profile_picture_urls.length >= 1 ? (
              <img src={userDetail.profile_picture_urls[0]} alt="profile" />
            ) : (
              // TODO: api to make anonymous unique avatar
              <img
                src="https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
                alt="profile-default"
              />
            )}
          </div>
        </div>

        {userDetail && userDetail.profile_picture_urls.length > 1
          ? userDetail.profile_picture_urls.map((url) => (
              <div className="avatar" key={url}>
                <div className="w-24 rounded-full">
                  <img src={url} alt="profile" />
                </div>
              </div>
            ))
          : null}
      </div>
        <div className="form-control w-full max-w-xs justify-center">
          <p className="label">
            Alias: {userDetail?.alias}
          </p>
        </div>
        <div className="form-control w-full max-w-xs justify-center">
          <label className="label">
            <span className="label-text">Gender</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="gender"
            required
          >
            {enums.gender.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
        </div>
        <div className="form-control w-full max-w-xs justify-center">
          <label className="label">
            <span className="label-text">Bio</span>
          </label>
          <textarea
            name="bio"
            className="textarea textarea-bordered h-24"
            placeholder="Feeling Good today!"
            required
          >
            {userDetail?.bio}
          </textarea>
        </div>
        <label className="label">
          <span className="label-text">Height in (Cm)</span>
        </label>
        <input
          name="height"
          type="number"
          placeholder="180"
          className="input input-bordered w-full max-w-xs"
          defaultValue={userDetail?.height}
          max={400}
        />
        <label className="label">
          <span className="label-text">Education Level</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          name="education_level"
        >
          {enums.educationLevel.map((value, idx) => (
            <option key={idx}>{value}</option>
          ))}
        </select>
        <div className="form-control w-full max-w-xs justify-center">
          <label className="label">
            <span className="label-text">Drinking</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="drinking"
          >
            {enums.drinkingSmokeLevel.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
          <label className="label">
            <span className="label-text">Smoking</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="smoking"
          >
            {enums.drinkingSmokeLevel.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
          <label className="label">
            <span className="label-text">Relationship Preferences</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="relationship_pref"
          >
            {enums.relationshipPrefrence.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
          <label className="label">
            <span className="label-text">Looking For</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="looking_for"
            required
          >
            {enums.gender.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
          <label className="label">
            <span className="label-text">Zodiac</span>
          </label>
          <select
            className="select select-bordered w-full max-w-xs"
            name="zodiac"
          >
            {enums.zodiac.map((value, idx) => (
              <option key={idx}>{value}</option>
            ))}
          </select>
          <label className="label">
            <span className="label-text">Kids</span>
          </label>
          <input
            name="kids"
            type="number"
            placeholder="1"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.kids}
            max={100}
          />
          <label className="label">
            <span className="label-text">Work</span>
          </label>
          <input
            name="work"
            type="text"
            placeholder="Freelance"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.work}
            maxLength={100}
          />
        </div>

        <button
          type="submit"
          className="my-4 form-control btn btn-primary dark:text-white "
        >
          Update
        </button>
      </Form>
    </div>
  );
}
