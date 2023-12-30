import { json, redirect } from "@remix-run/node";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { nanoid } from "nanoid";
import { Fragment, useCallback, useState } from "react";
import { Label, Input, Button, TextField, Text } from "react-aria-components";
import { guard } from "~/api/api";
import { User, UserForm } from "~/api/user";

export const action = async (
  args: ActionFunctionArgs
): Promise<UserForm.InterestEditSchemaError | TypedResponse<undefined>> => {
  const formData = await args.request.formData();

  const data: UserForm.InterestEditSchema = {};

  {
    // Transform from formData to InterestEditSchema
    const hobbieIds = formData.getAll("hobbies[].id") as string[];
    const hobbies = formData.getAll("hobbies[].name") as string[];
    for (let i = 0; i < hobbieIds.length; i++) {
      const entry = {
        id: hobbieIds[i],
        name: hobbies[i],
      };

      data.hobbies ? data.hobbies.push(entry) : (data.hobbies = [entry]);
    }

    const movieSerieIds = formData.getAll("movie_series[].id") as string[];
    const movieSeries = formData.getAll("movie_series[].name") as string[];
    for (let i = 0; i < movieSerieIds.length; i++) {
      const entry = {
        id: movieSerieIds[i],
        name: movieSeries[i],
      };
      data.movie_series
        ? data.movie_series.push(entry)
        : (data.movie_series = [entry]);
    }

    const sportIds = formData.getAll("sports[].id") as string[];
    const sports = formData.getAll("sports[].name") as string[];
    for (let i = 0; i < sportIds.length; i++) {
      const entry = {
        id: sportIds[i],
        name: sports[i],
      };
      data.sports ? data.sports.push(entry) : (data.sports = [entry]);
    }

    const travelIds = formData.getAll("travels[].id") as string[];
    const travels = formData.getAll("travels[].name") as string[];
    for (let i = 0; i < travelIds.length; i++) {
      const entry = {
        id: travelIds[i],
        name: travels[i],
      };
      data.travels ? data.travels.push(entry) : (data.travels = [entry]);
    }

    data.new_hobbies =
      (formData.getAll("new_hobbies[]") as string[]) ?? undefined;
    data.new_movie_series =
      (formData.getAll("new_movie_series[]") as string[]) ?? undefined;
    data.new_sports =
      (formData.getAll("new_sports[]") as string[]) ?? undefined;
    data.new_travels =
      (formData.getAll("new_travels[]") as string[]) ?? undefined;

    data.deleted_hobbies =
      (formData.getAll("deleted_hobbies[]") as string[]) ?? undefined;
    data.deleted_movie_series =
      (formData.getAll("deleted_movie_series[]") as string[]) ?? undefined;
    data.deleted_sports =
      (formData.getAll("deleted_sports[]") as string[]) ?? undefined;
    data.deleted_travels =
      (formData.getAll("deleted_travels[]") as string[]) ?? undefined;
  }

  const interest = UserForm.interestEditSchema.safeParse(data);
  if (!interest.success) {
    const d = interest.error.format();
    console.log(JSON.stringify(d, null, 2));
    return d;
  }

  const res = await guard(args);
  if (!res) {
    return redirect("/sign-in");
  }

  await User.editInterest(res.token, res.userId, {
    create: {
      hobbies: interest.data.new_hobbies,
      movie_series: interest.data.new_movie_series,
      sports: interest.data.new_sports,
      travels: interest.data.new_sports,
    },
    update: {
      hobbies: interest.data.hobbies,
      movie_series: interest.data.movie_series,
      sports: interest.data.sports,
      travels: interest.data.travels,
    },
    delete: {
      hobbie_ids: interest.data.deleted_hobbies,
      movie_serie_ids: interest.data.deleted_movie_series,
      sport_ids: interest.data.deleted_sports,
      travel_ids: interest.data.deleted_travels,
    },
  });

  return json(undefined, 200);
};

export const loader = async (
  args: LoaderFunctionArgs
): Promise<{ interest: User.Interest } | TypedResponse<never>> => {
  if (process.env?.["APP_ENV"] == "local") {
    return {
      interest: {
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
    interest: {
      hobbies: userDetail.hobbies ?? [],
      movie_series: userDetail.movie_series ?? [],
      sports: userDetail.sports ?? [],
      travels: userDetail.travels ?? [],
    },
  };
};
export default function InterestEditPage() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Form method="PUT" className="m-4">
      <InterestEditItem
        initialItems={data.interest.hobbies}
        name="hobbies"
        label="Hobbies"
        errors={{
          items: actionData?.hobbies,
          new_items: actionData?.new_hobbies,
        }}
      />
      <InterestEditItem
        initialItems={data.interest.movie_series}
        name="movie_series"
        label="Movie & Series"
        errors={{
          items: actionData?.movie_series,
          new_items: actionData?.new_movie_series,
        }}
      />
      <InterestEditItem
        initialItems={data.interest.sports}
        name="sports"
        label="Sports"
        errors={{
          items: actionData?.sports,
          new_items: actionData?.new_sports,
        }}
      />
      <InterestEditItem
        initialItems={data.interest.travels}
        name="travels"
        label="Travels"
        errors={{
          items: actionData?.travels,
          new_items: actionData?.new_travels,
        }}
      />
      <Button type="submit" className="btn btn-primary w-auto text-white my-8">
        Submit
      </Button>
    </Form>
  );
}

type InterestItemType = { id: string; name: string };

type InterestItemProps = {
  initialItems: InterestItemType[];
  label: string;
  name: string;
  maximumItem?: number;
  errors?: {
    items?: {
      [key: string]: unknown;
    };
    new_items?: {
      [key: string]: unknown;
    };
  };
};

type InterestItemState = {
  items: InterestItemType[];
  newItems: InterestItemType[];
  deletedIds: string[];
};

function InterestEditItem({
  initialItems,
  label,
  name,
  errors,
  maximumItem = 10,
}: InterestItemProps) {
  const [data, setData] = useState<InterestItemState>({
    items: initialItems,
    newItems: [],
    deletedIds: [],
  });

  const onRemoveExistingItem = (id: string) => {
    setData((v) => ({
      ...v,
      items: v.items.filter((v) => v.id !== id),
      deletedIds: [...v.deletedIds, id],
    }));
  };

  const onChangeExistingItem = (name: string, id: string) => {
    setData((v) => {
      const idx = v.items.findIndex((v) => v.id === id);
      if (idx === -1) {
        return v;
      }

      v.items[idx].name = name;

      return {
        ...v,
        items: [...v.items],
      };
    });
  };

  const onAddNewItem = useCallback(() => {
    setData((v) => ({
      ...v,
      newItems: [
        ...v.newItems,
        {
          id: nanoid(10),
          name: "",
        },
      ],
    }));
  }, []);

  const onRemoveNewItem = (id: string) => {
    setData((v) => {
      return {
        ...v,
        newItems: v.newItems.filter((v) => v.id !== id),
      };
    });
  };

  const onChangeNewItem = (name: string, id: string) => {
    setData((v) => {
      const idx = v.newItems.findIndex((v) => v.id === id);
      if (idx === -1) {
        return v;
      }

      v.newItems[idx].name = name;

      return {
        ...v,
        newItems: [...v.newItems],
      };
    });
  };

  return (
    <div className="form-control w-full max-w-xs justify-center">
      <Label className="label self-start">
        <span className="label-text text-white text-lg">{label}</span>
        <Button
          type="button"
          className="btn btn-ghost text-primary"
          isDisabled={data.newItems.length + data.items.length >= maximumItem}
          onPress={onAddNewItem}
        >
          Add
        </Button>
      </Label>

      <div className="flex flex-row flex-wrap gap-1">
        {data.items.map((v, idx) => (
          <Fragment key={v.id}>
            <Input
              hidden
              aria-hidden
              name={`${name}[].id`}
              className="hidden"
              type="hidden"
              value={v.id}
            />

            <TextField
              name={`${name}[].name`}
              type="text"
              aria-label={`${name}`}
              isRequired
              maxLength={10}
              value={v.name}
              className="basis-1/2-gap-1"
              onChange={(e) => {
                onChangeExistingItem(e, v.id);
                if (errors) errors.new_items = undefined;
              }}
            >
              <div className="p-1 focus-within:p-0 focus-within:border-white focus-within:border-2 focus-within:border-solid focus-within:rounded-full">
                <div className="badge badge-lg badge-neutral">
                  <Input className="bg-neutral mx-1 w-full text-white focus:outline-none" />
                  <Button
                    type="button"
                    className="focus:outline-none"
                    onPress={() => onRemoveExistingItem(v.id)}
                  >
                    ⓧ
                  </Button>
                </div>
              </div>

              <InterestEditErrorField
                errors={
                  (errors?.items?.[idx] as { name?: { _errors?: string[] } })
                    ?.name?._errors ?? undefined
                }
              />
            </TextField>
          </Fragment>
        ))}
        {data.newItems.map((v, idx) => (
          <TextField
            key={v.id}
            aria-label={`${name}`}
            name={`new_${name}[]`}
            type="text"
            isRequired
            autoFocus
            maxLength={10}
            value={v.name}
            className="basis-1/2-gap-1"
            onChange={(e) => {
              onChangeNewItem(e, v.id);
              if (errors) errors.new_items = undefined;
            }}
          >
            <div className="p-1 focus-within:p-0 focus-within:border-white focus-within:border-2 focus-within:border-solid focus-within:rounded-full">
              <div className="badge badge-lg badge-neutral ">
                <Input className="bg-neutral mx-1 w-full text-white focus:outline-none" />
                <Button
                  type="button"
                  className="focus:outline-none"
                  onPress={() => onRemoveNewItem(v.id)}
                >
                  ⓧ
                </Button>
              </div>
            </div>

            <InterestEditErrorField
              errors={
                (errors?.new_items?.[idx] as { _errors?: string[] })?._errors ??
                undefined
              }
            />
          </TextField>
        ))}
        {data.deletedIds.map((v) => (
          <Input
            hidden
            aria-hidden
            key={v}
            name={`deleted_${name}[]`}
            type="hidden"
            className="hidden"
            value={v}
          />
        ))}
      </div>
    </div>
  );
}

function InterestEditErrorField(props: { errors: string[] | undefined }) {
  if (!props.errors) {
    return null;
  }

  return (
    <Text className="text-sm text-error" slot="errorMessage">
      {props.errors?.join(" ")}
    </Text>
  );
}
