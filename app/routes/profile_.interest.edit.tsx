import { redirect } from "@remix-run/node";
import type {
  ActionFunction,
  DataFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { nanoid } from "nanoid";
import { Fragment, useState } from "react";
import { Label, Input, Button } from "react-aria-components";
import { guard } from "~/api/api";
import { User, UserForm } from "~/api/user";

export const action: ActionFunction = async (args) => {
  const formData = await args.request.formData();

  const data: UserForm.InterestEditSchema = {};
  {
    // Transform from formData to InterestEditSchema
    const hobbieIds = formData.getAll("hobbies[].id") as string[];
    const hobbies = formData.getAll("hobbies[].name") as string[];

    const movieSerieIds = formData.getAll("movie_series[].id") as string[];
    const movieSeries = formData.getAll("movie_series[].name") as string[];

    const sportIds = formData.getAll("sports[].id") as string[];
    const sports = formData.getAll("sports[].name") as string[];

    const travelIds = formData.getAll("travels[].id") as string[];
    const travels = formData.getAll("travels[].name") as string[];

    for (let i = 0; i < hobbieIds.length; i++) {
      const entry = {
        id: hobbieIds[i],
        name: hobbies[i],
      };
      data.hobbies ? data.hobbies.push(entry) : (data.hobbies = [entry]);
    }

    for (let i = 0; i < movieSerieIds.length; i++) {
      const entry = {
        id: movieSerieIds[i],
        name: movieSeries[i],
      };
      data.movie_series
        ? data.movie_series.push(entry)
        : (data.movie_series = [entry]);
    }
    for (let i = 0; i < sportIds.length; i++) {
      const entry = {
        id: sportIds[i],
        name: sports[i],
      };
      data.sports ? data.sports.push(entry) : (data.sports = [entry]);
    }
    for (let i = 0; i < travelIds.length; i++) {
      const entry = {
        id: travelIds[i],
        name: travels[i],
      };
      data.travels ? data.travels.push(entry) : (data.travels = [entry]);
    }

    data.new_hobbies = formData.getAll("new_hobbies[]") as string[];
    data.new_movie_series = formData.getAll("new_movie_series[]") as string[];
    data.new_sports = formData.getAll("new_sports[]") as string[];
    data.new_travels = formData.getAll("new_travels[]") as string[];

    data.deleted_hobbies = formData.getAll("deleted_hobbies[]") as string[];
    data.deleted_movie_series = formData.getAll(
      "deleted_movie_series"
    ) as string[];
    data.deleted_sports = formData.getAll("deleted_sports[]") as string[];
    data.deleted_travels = formData.getAll("deleted_travels[]") as string[];
  }

  const interest = UserForm.interestEditSchema.safeParse(data);
  if (!interest.success) {
    return interest.error.flatten().fieldErrors;
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
};

export const loader = async (
  args: DataFunctionArgs
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

  return {
    interest: {
      hobbies: userDetail?.hobbies ?? [],
      movie_series: userDetail?.movie_series ?? [],
      sports: userDetail?.sports ?? [],
      travels: userDetail?.travels ?? [],
    },
  };
};
export default function InterestEdit() {
  const data = useLoaderData<typeof loader>();

  return (
    <Form method="PUT" className="m-4">
      <InterestItem
        initialItems={data.interest.hobbies}
        name="hobbies"
        label="Hobbies"
      />
      <InterestItem
        initialItems={data.interest.movie_series}
        name="movie_series"
        label="Movie & Series"
      />
      <InterestItem
        initialItems={data.interest.sports}
        name="sports"
        label="Sports"
      />
      <InterestItem
        initialItems={data.interest.travels}
        name="travels"
        label="Travels"
      />
      <Button type="submit" className="btn btn-primary w-auto text-white my-8">
        Submit
      </Button>
    </Form>
  );
}

function InterestItem({
  initialItems,
  label,
  name,
}: {
  initialItems: { id: string; name: string }[];
  label: string;
  name: string;
}) {
  const [data, setData] = useState<{
    items: { id: string; name: string }[];
    newItems: { id: string; name: string }[];
    deletedIds: string[];
  }>({
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

  const onChangeExistingItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    setData((v) => {
      const idx = v.items.findIndex((v) => v.id === id);
      if (idx === -1) {
        return v;
      }

      v.items[idx].name = e.target.value;

      return {
        ...v,
        items: [...v.items],
      };
    });
  };

  const onAddNewItem = () => {
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
  };

  const onRemoveNewItem = (id: string) => {
    setData((v) => {
      return {
        ...v,
        newItems: v.newItems.filter((v) => v.id !== id),
      };
    });
  };

  const onChangeNewItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    setData((v) => {
      const idx = v.newItems.findIndex((v) => v.id === id);
      if (idx === -1) {
        return v;
      }

      v.newItems[idx].name = e.target.value;

      return {
        ...v,
        newItems: [...v.newItems],
      };
    });
  };

  return (
    <div className="form-control w-full max-w-xs justify-center">
      <Label className="label self-start">
        <span className="label-text text-white">{label}</span>
        <Button
          type="button"
          className="btn btn-ghost text-primary"
          isDisabled={data.newItems.length + data.items.length >= 10}
          onPress={onAddNewItem}
        >
          Add
        </Button>
      </Label>

      <div className="flex flex-row flex-wrap gap-1">
        {data.items.map((v) => (
          <Fragment key={v.id}>
            <Input
              hidden
              name={`${name}[].id`}
              className="hidden"
              type="hidden"
              value={v.id}
            />

            <div className="badge badge-neutral basis-1/3-gap-1">
              <Input
                name={`${name}[].name`}
                type="text"
                className="bg-neutral mx-1 w-full text-white"
                defaultValue={v.name}
                onChange={(e) => onChangeExistingItem(e, v.id)}
                maxLength={10}
                required
              />
              <Button type="button" onPress={() => onRemoveExistingItem(v.id)}>
                ⓧ
              </Button>
            </div>
          </Fragment>
        ))}
        {data.newItems.map((v) => (
          <div key={v.id} className="badge badge-neutral basis-1/3-gap-1">
            <Input
              name={`new_${name}[]`}
              type="text"
              className="bg-neutral mx-1 w-full text-white"
              value={v.name}
              onChange={(e) => onChangeNewItem(e, v.id)}
              maxLength={10}
              autoFocus
              required
            />
            <Button type="button" onPress={() => onRemoveNewItem(v.id)}>
              ⓧ
            </Button>
          </div>
        ))}
        {data.deletedIds.map((v) => (
          <Input
            hidden
            key={v}
            name={`deleted_${name}[]`}
            type="text"
            className="hidden"
            value={v}
          />
        ))}
      </div>
    </div>
  );
}
