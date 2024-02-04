import type { DataFunctionArgs } from "@remix-run/node";
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
): Promise<{
  user: ClerkUser | undefined;
  userDetail: User.Schema & { address?: string };
}> => {
  const result = await guard(args);
  if (!result) {
    throw redirect("/sign-in");
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
      if (!axios.isAxiosError(e) || !e.response) {
        throw e;
      }

      const data = apiError.parse(e.response.data);
      if (!data.errors) {
        throw e;
      }

      if (e.response.status === 404) {
        if (data.errors[0].code === "USER_NOT_FOUND") {
          throw redirect("/profile/edit");
        }
      }

      if (e.response.status === 401) {
        if (data.errors[0].code === "EXPIRED_AUTH") {
          throw redirect("/profile");
        }
      }

      throw e;
    });
};

export default function Profile() {
  const { user, userDetail } = useLoaderData<typeof loader>();

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
        <main>
          <ProfileHeader
            bio={userDetail.bio}
            gender={userDetail.gender}
            firstName={user?.firstName ?? null}
            lastName={user?.lastName ?? null}
            work={userDetail.work}
            education_level={userDetail.education_level}
            address={userDetail.address}
          />
          <div className="divider">Profile Info</div>
          <ProfileInfo
            drinking={userDetail.drinking}
            from_location={userDetail.from_location}
            height={userDetail.height}
            kids={userDetail.kids}
            looking_for={userDetail.looking_for}
            relationship_preferences={userDetail.relationship_preferences}
            smoking={userDetail.smoking}
            zodiac={userDetail.zodiac}
          />
          <div className="divider">Interest</div>
          <div className="flex flex-col gap-2 m-2">
            <InterestInfo
              hobbies={userDetail.hobbies}
              movie_series={userDetail.movie_series}
              sports={userDetail.sports}
              travels={userDetail.travels}
            />
            <Form action="interest/edit">
              <Button
                type="submit"
                className="my-4 form-control btn btn-sm btn-active btn-primary dark:text-white"
              >
                Edit Interest
              </Button>
            </Form>
          </div>
        </main>
      </div>
    </>
  );
}
export type ProfileHeaderProps = Optional<
  Pick<ClerkUser, "firstName" | "lastName"> &
    Pick<User.Schema, "gender" | "bio" | "work" | "education_level">,
  "firstName" | "lastName"
> & {
  address?: string;
};

export const ProfileHeader = (props: ProfileHeaderProps) => {
  return (
    <>
      <div className="pb-1">
        {props.firstName && props.lastName ? (
          <span className="text-lg text-white mr-2">
            {props.firstName} {props.lastName}
          </span>
        ) : null}
        <span className="">{props.gender}</span>
        <p></p>
      </div>
      <div className="pt-1">
        <WorkAndEducationLevel
          work={props.work ?? undefined}
          educationLevel={props.education_level ?? undefined}
        />
        <p>{props.address}</p>
        <p className="text-gray-50">{props.bio}</p>
      </div>
    </>
  );
};

export type ProfileInfoProps = Pick<
  User.Schema,
  | "from_location"
  | "looking_for"
  | "relationship_preferences"
  | "drinking"
  | "smoking"
  | "zodiac"
  | "height"
  | "kids"
>;
export const ProfileInfo = (props: ProfileInfoProps) => {
  return (
    <div className="m-2 flex flex-row gap-3 flex-wrap justify-between">
      {props.from_location ? (
        <div>
          <Label className="pr-2">From</Label>
          <span className="badge badge-primary text-white">
            {props.from_location}
          </span>
        </div>
      ) : null}
      <div>
        <Label className="pr-2">Dating</Label>
        <span className="badge badge-primary text-white">
          {props.looking_for}
        </span>
      </div>
      {props.relationship_preferences ? (
        <div>
          <Label className="pr-2">Pereferences</Label>
          <span className="badge badge-primary text-white">
            {props.relationship_preferences}
          </span>
        </div>
      ) : null}
      {props.drinking ? (
        <div>
          <Label className="pr-2">Drinking</Label>
          <span className="badge badge-primary text-white">
            {props.drinking}
          </span>
        </div>
      ) : null}
      {props.smoking ? (
        <div>
          <Label className="pr-2">Smoking</Label>
          <span className="badge badge-primary text-white">
            {props.smoking}
          </span>
        </div>
      ) : null}
      {props.zodiac ? (
        <div>
          <Label className="pr-2">Zodiac</Label>
          <span className="badge badge-primary text-white">{props.zodiac}</span>
        </div>
      ) : null}
      {props.height ? (
        <div>
          <Label className="pr-2">Height</Label>
          <span className="badge badge-primary text-white">
            {props.height} cm
          </span>
        </div>
      ) : null}

      {props.kids ? (
        <div>
          <Label className="pr-2">Kids</Label>
          <span className="badge badge-primary text-white">{props.kids}</span>
        </div>
      ) : null}
    </div>
  );
};

export type InterestInfoProps = Pick<
  User.Schema,
  "hobbies" | "movie_series" | "sports" | "travels"
>;
export const InterestInfo = (props: InterestInfoProps) => {
  return (
    <>
      {props.hobbies.length > 0 ? (
        <TagGroup selectionMode="none">
          <Label className="label">Hobbies</Label>
          <TagList className="flex gap-2">
            {props.hobbies.map((v) => {
              if (!v) {
                return null;
              }
              return (
                <Tag key={v.id} className="badge badge-primary text-white">
                  {v.name}
                </Tag>
              );
            })}
          </TagList>
        </TagGroup>
      ) : null}
      {props.movie_series.length > 0 ? (
        <TagGroup selectionMode="none">
          <Label className="label">Movies & Series</Label>
          <TagList className="flex gap-2">
            {props.movie_series.map((v) => {
              if (!v) {
                return null;
              }
              return (
                <Tag key={v.id} className="badge badge-primary text-white">
                  {v.name}
                </Tag>
              );
            })}
          </TagList>
        </TagGroup>
      ) : null}
      {props.sports.length > 0 ? (
        <TagGroup selectionMode="none">
          <Label className="label">Sports</Label>
          <TagList className="flex gap-2">
            {props.sports.map((v) => {
              if (!v) {
                return null;
              }
              return (
                <Tag key={v.id} className="badge badge-primary text-white">
                  {v.name}
                </Tag>
              );
            })}
          </TagList>
        </TagGroup>
      ) : null}
      {props.travels.length > 0 ? (
        <TagGroup selectionMode="none">
          <Label className="label">Travels</Label>
          <TagList className="flex gap-2">
            {props.travels.map((v) => {
              if (!v) {
                return null;
              }
              return (
                <Tag key={v.id} className="badge badge-primary text-white">
                  {v.name}
                </Tag>
              );
            })}
          </TagList>
        </TagGroup>
      ) : null}
    </>
  );
};

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
