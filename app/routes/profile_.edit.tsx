import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  DataFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import axios from "axios";
import type { SelectProps, TextFieldProps } from "react-aria-components";
import {
  Button,
  FieldError,
  FormValidationContext,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  NumberField,
  Popover,
  Select,
  SelectValue,
  Text,
  TextArea,
  TextField,
} from "react-aria-components";

import { apiError, guard } from "~/api/api";
import { User, UserForm } from "~/api/user";
import { useGeolocation } from "~/hook/useGeolocation";

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

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }

  const enums = {
    gender,
    relationshipPrefrence,
    educationLevel,
    drinkingSmokeLevel,
    zodiac,
  };

  return User.getDetail(result.token, result.userId)
    .then((userDetail) => {
      return {
        userDetail,
        enums,
      };
    })
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
          return {
            userDetail: undefined,
            enums,
          };
        }

        throw e;
      }

      if (e.response.status === 401) {
        if (data.errors?.[0].code === "EXPIRED_AUTH") {
          return redirect("/profile/edit");
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
      console.log(JSON.stringify(data, null, 2))
      throw e;
    });
};

export const action = async (
  args: ActionFunctionArgs
): Promise<UserForm.ProfileEditSchemaError | TypedResponse<null>> => {
  const formData = Object.fromEntries(
    Array.from(await args.request.formData()).filter(([_, v]) => v !== "")
  );

  if (typeof formData.gender === "string") {
    formData.gender = User.translateToEnum(formData.gender);
  }

  if (typeof formData.looking_for === "string") {
    formData.looking_for = User.translateToEnum(formData.looking_for);
  }

  const profileEdit = UserForm.profileEditSchema.safeParse(formData);
  if (!profileEdit.success) {
    return profileEdit.error.flatten();
  }

  const result = await guard(args);
  if (!result) {
    return redirect("/sign-in");
  }
  const payload = {
    ...profileEdit.data,
    location: {
      lat: profileEdit.data.latitude,
      lng: profileEdit.data.longitude,
    },
  } as Optional<UserForm.ProfileEditSchema, "latitude" | "longitude">;

  delete payload.latitude;
  delete payload.longitude;

  await User.upsertDetail(result.token, result.userId, payload).catch(
    console.log
  );

  return json(null, 200);
};
export default function EditProfilePage() {
  const result = useLoaderData<typeof loader>();
  const geog = useGeolocation({ lat: -6.2, lng: 106.816 });
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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

      <Form method="PUT" className="space-y-2">
        <FormValidationContext.Provider value={actionData?.fieldErrors ?? {}}>
          <EditProfileTextField
            type="text"
            name="alias"
            isRequired
            defaultValue={userDetail?.alias}
            minLength={5}
            label="Alias"
          />
          <EditProfileSelect
            name="gender"
            isRequired
            label="Gender"
            defaultSelectedKey={userDetail?.gender}
            items={enums.gender}
          />
          <TextField
            className="form-control w-full max-w-xs justify-center"
            aria-label="Bio"
            name="bio"
            defaultValue={userDetail?.bio}
            isRequired
          >
            <Label className="label label-text">Bio</Label>
            <TextArea
              className="textarea textarea-bordered h-24"
              placeholder="Feeling Good today!"
            />
            <EditProfileErrorField />
          </TextField>
          <NumberField
            className="form-control w-full max-w-xs justify-center"
            name="height"
            aria-label="Height in (Cm)"
            defaultValue={userDetail?.height ?? undefined}
            maxValue={400}
          >
            <Label className="label label-text">Height in (Cm)</Label>
            <Input
              placeholder="180"
              className="input input-bordered w-full max-w-xs"
            />
            <EditProfileErrorField />
          </NumberField>
          <EditProfileSelect
            name="education_level"
            label="Education Level"
            defaultSelectedKey={userDetail?.education_level ?? undefined}
            items={enums.educationLevel}
          />
          <EditProfileSelect
            name="drinking"
            label="Drinking"
            defaultSelectedKey={userDetail?.drinking ?? undefined}
            items={enums.drinkingSmokeLevel}
          />
          <EditProfileSelect
            name="smoking"
            label="Smoking"
            defaultSelectedKey={userDetail?.smoking ?? undefined}
            items={enums.drinkingSmokeLevel}
          />
          <EditProfileSelect
            name="relationship_pref"
            label="Relationship Preference"
            defaultSelectedKey={
              userDetail?.relationship_preferences ?? undefined
            }
            items={enums.relationshipPrefrence}
          />
          <EditProfileSelect
            name="looking_for"
            isRequired
            label="Looking For"
            defaultSelectedKey={userDetail?.looking_for}
            items={enums.gender}
          />
          <EditProfileSelect
            name="zodiac"
            label="Zodiac"
            defaultSelectedKey={userDetail?.zodiac ?? undefined}
            items={enums.zodiac}
          />

          <NumberField
            className="form-control w-full max-w-xs justify-center"
            name="kids"
            defaultValue={userDetail?.kids ?? undefined}
            maxValue={100}
            aria-label="Kids"
          >
            <Label className="label label-text">Kids</Label>
            <Input className="input input-bordered w-full max-w-xs" />
            <EditProfileErrorField />
          </NumberField>
          <EditProfileTextField
            name="work"
            type="text"
            defaultValue={userDetail?.work ?? undefined}
            maxLength={100}
            label="Work"
          />
          <Input
            hidden
            aria-hidden
            type="hidden"
            name="latitude"
            defaultValue={geog?.position?.coords?.latitude}
          />
          <Input
            hidden
            type="hidden"
            aria-hidden
            name="longitude"
            defaultValue={geog?.position?.coords?.longitude}
          />
          <Button
            type="submit"
            isDisabled={isSubmitting}
            className="my-4 btn btn-primary dark:text-white "
          >
            {isSubmitting ? (
              <span className="loading loading-spinner"></span>
            ) : null}
            Update
          </Button>
        </FormValidationContext.Provider>
      </Form>
    </div>
  );
}
type EditProfileSelectProps = {
  label: string;
  items: string[];
} & SelectProps<any>;

function EditProfileSelect({ items, label, ...props }: EditProfileSelectProps) {
  return (
    <Select
      className="form-control w-full max-w-xs justify-center"
      {...props}
      aria-label={label}
    >
      <Label className="label label-text">{label}</Label>
      <Button>
        <SelectValue className="select select-bordered w-full max-w-xs items-center" />
      </Button>
      <Popover className="">
        <ListBox className="p-2 shadow menu z-[1] bg-base-200 space-y-2 divide-y-2 divide-gray-500 rounded-box w-52">
          {items.map((value, idx) => (
            <ListBoxItem key={idx} id={value}>
              {value}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
      <EditProfileErrorField />
    </Select>
  );
}

type EditProfileTextFieldProps = {
  label: string;
} & TextFieldProps;
function EditProfileTextField({ label, ...props }: EditProfileTextFieldProps) {
  return (
    <TextField
      className="form-control w-full max-w-xs"
      {...props}
      aria-label={label}
    >
      <Label className="label label-text">{label}</Label>
      <Input className="input input-bordered w-full max-w-xs" />
      <EditProfileErrorField />
    </TextField>
  );
}

function EditProfileErrorField() {
  return (
    <FieldError>
      {(v) =>
        v.isInvalid ? (
          <Label className="label">
            <Text className="label-text-alt text-error" slot="errorMessage">
              {v.validationErrors.join(" ")}
            </Text>
          </Label>
        ) : null
      }
    </FieldError>
  );
}
