import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type { UserSchema } from "~/api/api";
import { userSchema } from "~/api/api";
import { userAPI } from "~/api/user";
import * as v from "valibot";
export const action = () => {};
export const loader = async (
  args: DataFunctionArgs
): Promise<UserSchema | null> => {
  const { userId, getToken } = await getAuth(args);
  if (!userId) {
    return null;
  }

  const token = await getToken();
  if (!token) {
    return null;
  }

  const resp = await fetch(`${userAPI}/${userId}/detail`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  switch (resp.status) {
    case 404:
      return null;
    case 200:
      const { data: userDetail } = await resp.json();
      return v.parse(userSchema, userDetail);
    default:
      throw new Response("Internal Server error", { status: 500 });
  }
};

export default function EditProfilePage() {
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

      <Form id="profile-edit" method="PUT">
        <div className="form-control w-full max-w-xs justify-center">
          <label className="label">
            <span className="label-text">Alias</span>
          </label>
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.alias}
          />
        </div>
        <div className="form-control w-full max-w-xs justify-center">
          <label className="label">
            <span className="label-text">Bio</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Feeling Good today!"
          >
            {userDetail?.bio}
          </textarea>
        </div>
        <div className="form-control w-full max-w-xs justify-center">
        <label className="label">
            <span className="label-text">Drinking</span>
          </label >
          <select className="select select-bordered w-full max-w-xs">
            <option disabled selected>
              Never
            </option>
            <option>Han Solo</option>
            <option>Greedo</option>
          </select>
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
