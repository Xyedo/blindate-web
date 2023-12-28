import type { DataFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { guard } from "~/api/api";
import { User } from "~/api/user";

import type { User as ClerkUser } from "@clerk/remix/api.server";
import { Button, Label, Tag, TagGroup, TagList } from "react-aria-components";
import { reverseGeocode } from "~/api/maps/api";

export const loader = async (
  args: DataFunctionArgs
): Promise<
  | {
      user: ClerkUser | undefined;
      userDetail: User.Schema & { address?: string };
    }
  | TypedResponse<null>
> => {
  if (process.env?.["APP_ENV"] == "local") {
    return {
      user: {
        firstName: "Hafid",
        lastName: "Mahdi",
        backupCodeEnabled: false,
        banned: false,
        birthday: "1345",
        createdAt: 124124,
        emailAddresses: [],
        externalAccounts: [],
        externalId: null,
        gender: "male",
        id: "user_asrf90",
        hasImage: false,
        imageUrl: "",
        lastSignInAt: 124125412,
        passwordEnabled: false,
        phoneNumbers: [],
        primaryEmailAddressId: null,
        primaryPhoneNumberId: null,
        primaryWeb3WalletId: null,
        privateMetadata: {},
        publicMetadata: {},
        totpEnabled: false,
        twoFactorEnabled: false,
        unsafeMetadata: {},
        updatedAt: 1235235,
        username: "adad",
        web3Wallets: [],
        profileImageUrl: "",
      },
      userDetail: {
        alias: "admin",
        bio: `hehehe gatau nich\n\n\nhit me up pls`,
        gender: "Male",
        geo: {
          lat: 10,
          lng: 80,
        },
        looking_for: "Female",
        user_id: "user_1234",
        address: await reverseGeocode({
          lat: -6.2,
          lng: 106.8166,
        }),
        from_location: "Indonesia",
        drinking: "Ocassionally",
        smoking: "Never",
        education_level: "Bachelor Degree",
        work: "Software Engineer",
        relationship_preferences: "Casual",
        height: 175,
        kids: 0,
        zodiac: "Virgo",
        profile_picture_urls: [],
        hobbies: [
          { id: "hobbies_1", name: "Ngoding" },
          { id: "hobbies_2", name: "Kulineran" },
          { id: "hobbies_3", name: "Pacaran" },
        ],
        movie_series: [
          { id: "movie_series_1", name: "100 Days" },
          { id: "movie_series_2", name: "Spartans" },
        ],
        sports: [
          { id: "sport_1", name: "Basket" },
          { id: "sport_2", name: "Futsal" },
        ],
        travels: [
          { id: "travel_1", name: "Gunung" },
          { id: "travel_2", name: "Bali" },
          { id: "travel_3", name: "Singapore" },
        ],
      },
    };
  }

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  const userDetail = await User.getDetail(result.token, result.userId);

  if (!userDetail) {
    return redirect("/profile/edit");
  }

  return {
    user: result.user,
    userDetail: {
      ...userDetail,
      address: await reverseGeocode({
        lat: userDetail.geo.lat,
        lng: userDetail.geo.lng,
      }),
    },
  };
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
              work={userDetail.work}
              educationLevel={userDetail.education_level}
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
            {userDetail.hobbies.length > 1 ? (
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
            {userDetail.movie_series.length > 1 ? (
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
            {userDetail.sports.length > 1 ? (
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
            {userDetail.travels.length > 1 ? (
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
            <Form action="/interest/edit">
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
