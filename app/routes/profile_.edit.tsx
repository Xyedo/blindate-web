import { redirect } from "@remix-run/node";
import type {
  ActionFunction,
  DataFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  TextArea,
  TextField,
} from "react-aria-components";

import { guard } from "~/api/api";
import { User, UserForm } from "~/api/user";
import { useGeolocation } from "~/hook/useGeolocation";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();

  const data = Object.fromEntries(
    Array.from(formData).filter(([_, v]) => v !== "")
  );

  if (typeof data.gender === "string") {
    data.gender = User.translateToEnum(data.gender);
  }

  if (typeof data.looking_for === "string") {
    data.looking_for = User.translateToEnum(data.looking_for);
  }

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  const profileEdit = UserForm.profileEditSchema.parse(data);

  return User.upsertDetail(result.token, result.userId, {
    ...profileEdit,
    location: { lat: profileEdit.latitude, lng: profileEdit.longitude },
  });
};

export const loader = async (
  args: DataFunctionArgs
): Promise<
  | TypedResponse<null>
  | {
      userDetail: User.Schema | undefined;
      enums: {
        gender: string[];
        relationshipPrefrence: ReturnType<
          typeof User.getEnumRelationshipPrefrence
        >;
        educationLevel: ReturnType<typeof User.getEnumEducationLevel>;
        drinkingSmokeLevel: ReturnType<
          typeof User.getEnumDrinnkingOrSmokeLevel
        >;
        zodiac: ReturnType<typeof User.getEnumZodiac>;
      };
    }
> => {
  const gender = User.getEnumGender().map((v) =>
    User.translateGenderEnumToHuman(v)
  );
  const relationshipPrefrence = User.getEnumRelationshipPrefrence();
  const educationLevel = User.getEnumEducationLevel();
  const drinkingSmokeLevel = User.getEnumDrinnkingOrSmokeLevel();
  const zodiac = User.getEnumZodiac();

  if (process.env?.["APP_ENV"] == "local") {
    return {
      userDetail: undefined,
      enums: {
        gender,
        relationshipPrefrence,
        educationLevel,
        drinkingSmokeLevel,
        zodiac,
      },
    };
  }

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  const userDetail = await User.getDetail(result.token, result.userId);

  return {
    userDetail,
    enums: {
      gender,
      relationshipPrefrence,
      educationLevel,
      drinkingSmokeLevel,
      zodiac,
    },
  };
};

export default function EditProfilePage() {
  const result = useLoaderData<typeof loader>();
  const geog = useGeolocation({ lat: -6.2, lng: 106.816 });
  if (!result) {
    return null;
  }

  const { userDetail, enums } = result;
  const selectedPhoto = userDetail?.profile_picture_urls[0];
  const anotherPhotos = userDetail?.profile_picture_urls.slice(1);
  return (
    <div className="m-4">
      {/* TODO: handle left and right swipe on photos */}
      <div className="ml-4 mt-4">
        <p className="mb-4">Avatar</p>
        <div className="avatar">
          <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
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

        {anotherPhotos && anotherPhotos.length >= 1
          ? anotherPhotos.map((url) => (
              <div className="avatar" key={url}>
                <div className="w-24 rounded-full">
                  <img src={url} alt="profile" />
                </div>
              </div>
            ))
          : null}
      </div>

      <Form method="PUT">
        <TextField className="form-control w-full max-w-xs">
          <Label className="label">
            <span className="label-text">Alias</span>
          </Label>
          <Input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full max-w-xs"
            required
          />
        </TextField>
        <Select
          name="gender"
          className="form-control w-full max-w-xs justify-center"
          isRequired
        >
          <Label className="label">
            <span className="label-text">Gender</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.gender.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
        <TextField className="form-control w-full max-w-xs justify-center">
          <Label className="label">
            <span className="label-text">Bio</span>
          </Label>
          <TextArea
            name="bio"
            className="textarea textarea-bordered h-24"
            placeholder="Feeling Good today!"
            required
          >
            {userDetail?.bio}
          </TextArea>
        </TextField>
        <TextField className="form-control w-full max-w-xs justify-center">
          <Label className="label">
            <span className="label-text">Height in (Cm)</span>
          </Label>
          <Input
            name="height"
            type="number"
            placeholder="180"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.height}
            max={400}
          />
        </TextField>
        <Select
          name="education_level"
          className="form-control w-full max-w-xs justify-center"
        >
          <Label className="label">
            <span className="label-text">Education Level</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.educationLevel.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Select
          name="drinking"
          className="form-control w-full max-w-xs justify-center"
        >
          <Label className="label">
            <span className="label-text">Drinking</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.drinkingSmokeLevel.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Select
          name="smoking"
          className="form-control w-full max-w-xs justify-center"
        >
          <Label className="label">
            <span className="label-text">Smoking</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.drinkingSmokeLevel.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Select
          name="relationship_pref"
          className="form-control w-full max-w-xs justify-center"
        >
          <Label className="label">
            <span className="label-text">Relationship Preference</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.relationshipPrefrence.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Select
          name="looking_for"
          className="form-control w-full max-w-xs justify-center"
          isRequired
        >
          <Label className="label">
            <span className="label-text">Looking For</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.gender.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>

        <Select
          name="zodiac"
          className="form-control w-full max-w-xs justify-center"
        >
          <Label className="label">
            <span className="label-text">Zodiac</span>
          </Label>
          <Button>
            <SelectValue className="select select-bordered w-full max-w-xs items-center" />
          </Button>
          <Popover>
            <ListBox className="p-2 shadow menu z-[1] bg-base-100 rounded-box w-52">
              {enums.zodiac.map((value, idx) => (
                <ListBoxItem key={idx} id={value}>
                  {value}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
        <TextField className="form-control w-full max-w-xs justify-center">
          <Label className="label">
            <span className="label-text">Kids</span>
          </Label>
          <Input
            name="kids"
            type="number"
            placeholder="1"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.kids}
            max={100}
          />
        </TextField>
        <TextField className="form-control w-full max-w-xs justify-center">
          <Label className="label">
            <span className="label-text">Work</span>
          </Label>
          <Input
            name="work"
            type="text"
            placeholder="Freelance"
            className="input input-bordered w-full max-w-xs"
            defaultValue={userDetail?.work}
            maxLength={100}
          />
        </TextField>
        <Input
          hidden
          name="latitude"
          value={geog?.position?.coords?.latitude}
        />
        <Input
          hidden
          name="longitude"
          value={geog?.position?.coords?.longitude}
        />
        <Button
          type="submit"
          className="my-4 form-control btn btn-primary dark:text-white "
        >
          Update
        </Button>
      </Form>
    </div>
  );
}
