import { redirect } from "@remix-run/node";
import type {
  ActionFunction,
  DataFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Fragment, useState } from "react";
import { Label, Input, Button } from "react-aria-components";
import { guard } from "~/api/api";
import { User, UserForm } from "~/api/user";

export const action: ActionFunction = async (args) => {
  const formData = Object.fromEntries(await args.request.formData());

  console.log({ formData });
  const interest = UserForm.interestEditSchema.safeParse(formData);
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
    newItems: string[];
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
      newItems: [...v.newItems, ""],
    }));
  };

  const onRemoveNewItem = (idx: number) => {
    setData((v) => {
      v.newItems.splice(idx, 1);
      return {
        ...v,
        newItems: [...v.newItems],
      };
    });
  };

  const onChangeNewItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    setData((v) => {
      v.newItems[idx] = e.target.value;

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
        {data.items.map((v, idx) => (
          <Fragment key={v.id}>
            <Input
              hidden
              name={`${name}[${idx}].id`}
              className="hidden"
              type="hidden"
              value={v.id}
            />

            <div className="badge badge-neutral basis-1/3-gap-1">
              <Input
                id={`${name}[${idx}].name`}
                name={`${name}[${idx}].name`}
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
        {data.newItems.map((v, idx) => (
          <div key={idx} className="badge badge-neutral basis-1/3-gap-1">
            <Input
              id={`new_${name}[${idx}]`}
              name={`new_${name}[${idx}]`}
              type="text"
              className="bg-neutral mx-1 w-full text-white"
              value={v}
              onChange={(e) => onChangeNewItem(e, idx)}
              maxLength={10}
              required
            />
            <Button type="button" onPress={() => onRemoveNewItem(idx)}>
              ⓧ
            </Button>
          </div>
        ))}
        {data.deletedIds.map((v, idx) => (
          <Input
            hidden
            key={idx}
            name={`deleted_${name}[${idx}]`}
            type="text"
            className="hidden"
            value={v}
          />
        ))}
      </div>
    </div>
  );
}
