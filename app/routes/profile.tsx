import type { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { apiError, guard } from "~/api/api";
import { User } from "~/api/user";

import type { User as ClerkUser } from "@clerk/remix/api.server";
import { Button, Label, Tag, TagGroup, TagList } from "react-aria-components";
import { reverseGeocode } from "~/api/maps/api";
import axios from "axios";

export const loader = async (
  args: DataFunctionArgs
): Promise<
  | {
      user: ClerkUser | undefined;
      userDetail: User.Schema & { address?: string };
    }
  | TypedResponse<null>
> => {
  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  return User.getDetail(result.token, result.userId)
    .then(async (userDetail) => ({
      user: result.user,
      userDetail: {
        ...userDetail,
        address: await reverseGeocode({
          lat: userDetail.geo.lat,
          lng: userDetail.geo.lng,
        }),
      },
    }))
    .catch((e) => {
      if (!axios.isAxiosError(e)) {
        throw e;
      }

      if (!e.response) {
        throw e;
      }

      const data = apiError.parse(e.response.data);
      if (e.response.status === 404) {
        if (data.errors?.[0].code === "USER_NOT_FOUND") {
          return redirect("/profile/edit");
        }

        throw e;
      }

      if (e.response.status === 401) {
        if (data.errors?.[0].code === "EXPIRED_AUTH") {
          return redirect("/profile");
        }
        if (
          data.errors?.[0].code &&
          ["INVALID_AUTHORIZATION", "UNAUTHORIZED"].includes(
            data.errors?.[0].code
          )
        ) {
          return redirect("/sign-in");
        }

        throw e;
      }

      throw e;
    });
};

export default function Profile() {
  const result = useLoaderData<typeof loader>();
  if (!result) {
    return null;
  }

  const { user, userDetail } = result;

  const selectedPhoto = userDetail.profile_picture_urls?.[0];
  return (
    <>
      <div className="mx-3 my-6">
        {/* TODO: handle left and right swipe on photos */}
        <header className="m-4 flex">
          <div className="avatar justify-center mr-6 flex-col flex-shrink-0 relative">
            <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              {selectedPhoto ? (
                <img src={selectedPhoto} alt="profile" />
              ) : (
                // TODO: api to make anonymous unique avatar
                <img
                  src="https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
                  alt="profile-default"
                />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-lg text-white">{userDetail?.alias}</h1>
            <Form action="edit">
              <Button
                type="submit"
                className="my-4 form-control btn btn-sm btn-active btn-primary dark:text-white"
              >
                Edit Profile
              </Button>
            </Form>
          </div>
        </header>
        <section className="">
          <div className="pb-1">
            {user?.firstName && user?.lastName ? (
              <span className="text-lg text-white mr-2">
                {user.firstName} {user.lastName}
              </span>
            ) : null}
            <span className="">{userDetail.gender}</span>
            <p></p>
          </div>
          <div className="pt-1">
            <WorkAndEducationLevel
              work={userDetail.work ?? undefined}
              educationLevel={userDetail.education_level ?? undefined}
            />
            <p>{userDetail.address}</p>
            <p className="text-gray-50">{userDetail.bio}</p>
          </div>
          <div className="divider">Profile Info</div>
          <div className="m-2 flex flex-row gap-3 flex-wrap justify-between">
            {userDetail.from_location ? (
              <div>
                <Label className="pr-2">From</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.from_location}
                </span>
              </div>
            ) : null}
            <div>
              <Label className="pr-2">Dating</Label>
              <span className="badge badge-primary text-white">
                {userDetail.looking_for}
              </span>
            </div>
            {userDetail.relationship_preferences ? (
              <div>
                <Label className="pr-2">Pereferences</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.relationship_preferences}
                </span>
              </div>
            ) : null}
            {userDetail.drinking ? (
              <div>
                <Label className="pr-2">Drinking</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.drinking}
                </span>
              </div>
            ) : null}
            {userDetail.smoking ? (
              <div>
                <Label className="pr-2">Smoking</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.smoking}
                </span>
              </div>
            ) : null}
            {userDetail.zodiac ? (
              <div>
                <Label className="pr-2">Zodiac</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.zodiac}
                </span>
              </div>
            ) : null}
            {userDetail.height ? (
              <div>
                <Label className="pr-2">Height</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.height} cm
                </span>
              </div>
            ) : null}

            {userDetail.kids ? (
              <div>
                <Label className="pr-2">Kids</Label>
                <span className="badge badge-primary text-white">
                  {userDetail.kids}
                </span>
              </div>
            ) : null}
          </div>
          <div className="divider">Interest</div>
          <div className="flex flex-col gap-2 m-2">
            {userDetail.hobbies.length > 0 ? (
              <TagGroup selectionMode="none">
                <Label className="label">Hobbies</Label>
                <TagList className="flex gap-2">
                  {userDetail.hobbies.map((v) => (
                    <Tag key={v.id} className="badge badge-primary text-white">
                      {v.name}
                    </Tag>
                  ))}
                </TagList>
              </TagGroup>
            ) : null}
            {userDetail.movie_series.length > 0 ? (
              <TagGroup selectionMode="none">
                <Label className="label">Movies & Series</Label>
                <TagList className="flex gap-2">
                  {userDetail.movie_series.map((v) => (
                    <Tag key={v.id} className="badge badge-primary text-white">
                      {v.name}
                    </Tag>
                  ))}
                </TagList>
              </TagGroup>
            ) : null}
            {userDetail.sports.length > 0 ? (
              <TagGroup selectionMode="none">
                <Label className="label">Sports</Label>
                <TagList className="flex gap-2">
                  {userDetail.sports.map((v) => (
                    <Tag key={v.id} className="badge badge-primary text-white">
                      {v.name}
                    </Tag>
                  ))}
                </TagList>
              </TagGroup>
            ) : null}
            {userDetail.travels.length > 0 ? (
              <TagGroup selectionMode="none">
                <Label className="label">Travels</Label>
                <TagList className="flex gap-2">
                  {userDetail.travels.map((v) => (
                    <Tag key={v.id} className="badge badge-primary text-white">
                      {v.name}
                    </Tag>
                  ))}
                </TagList>
              </TagGroup>
            ) : null}
            <Form action="interest/edit">
              <Button
                type="submit"
                className="my-4 form-control btn btn-sm btn-active btn-primary dark:text-white"
              >
                Edit Interest
              </Button>
            </Form>
          </div>
        </section>
      </div>
    </>
  );
}

const WorkAndEducationLevel = ({
  work,
  educationLevel,
}: {
  work?: string;
  educationLevel?: string;
}) => {
  if (work && educationLevel) {
    return (
      <span>
        {work}, {educationLevel}
      </span>
    );
  }

  if (work) {
    return <span>{work}</span>;
  }

  if (educationLevel) {
    return <span>{educationLevel}</span>;
  }

  return null;
};
