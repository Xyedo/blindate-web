import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { Button, Dialog, Heading, Input, Modal } from "react-aria-components";
import { guard } from "~/api/api";
import { Match } from "~/api/match";
import { ProfileHeader, ProfileInfo, InterestInfo } from "~/routes/profile";

export const loader = async (
  args: LoaderFunctionArgs
): Promise<Match.MatchSchemaWithStatus> => {
  const result = await guard(args);
  if (!result) {
    throw redirect("/sign-in");
  }

  if (!args.params.matchId) {
    throw new Error("invalid matchId param");
  }

  return Match.get(result.token, args.params.matchId);
};

export default function MatchId() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <>
      <Modal
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        defaultOpen
        onOpenChange={(isOpen) => {
          if (!isOpen) navigate("/match");
        }}
      >
        <Dialog className="h-screen flex justify-center items-center">
          {({ close }) => <MatchCard {...data} close={close} />}
        </Dialog>
      </Modal>
    </>
  );
}

export type MatchCardProps = Match.MatchSchemaWithStatus & { close?: () => void };
export function MatchCard(props: MatchCardProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  return (
    <div className="card w-full max-w-xs bg-base-200 shadow-xl">
      {props.profile_picture_urls.length > 0 ? (
        <figure>
          <img src={props.profile_picture_urls[0]} alt="Profile" />
        </figure>
      ) : null}

      <div className="card-body">
        <Heading className="card-title">{props.alias}</Heading>
        {props.distance ? (
          <p className="text-sm">{props.distance.toFixed(3)} km Away</p>
        ) : null}

        <ProfileHeader
          bio={props.bio}
          gender={props.gender}
          work={props.work}
          education_level={props.education_level}
        />
        <div className="divider">Profile Info</div>
        <ProfileInfo
          drinking={props.drinking}
          from_location={props.from_location}
          height={props.height}
          kids={props.kids}
          looking_for={props.looking_for}
          relationship_preferences={props.relationship_preferences}
          smoking={props.smoking}
          zodiac={props.zodiac}
        />
        <div className="card-actions flex justify-around">
          <Button
            type="button"
            className="btn btn-primary text-white"
            onPress={props.close}
          >
            Close
          </Button>
          {props.status === "accepted" ? (
            <Form action={`conversation/${props.id}`}>
              <Button type="submit" className="btn btn-primary text-white">
                Chat
              </Button>
            </Form>
          ) : null}
          {props.status === "likes" ? (
            <Form
              action="/match"
              method="PUT"
              className="flex justify-around items-center"
            >
              <Input type="hidden" name="matchId" value={props.id} />
              <Button
                type="submit"
                name="swipe"
                value="false"
                className="btn btn-primary text-white"
                isDisabled={isSubmitting}
              >
                Not Interested
              </Button>
              <Button
                type="submit"
                name="swipe"
                value="true"
                className="btn btn-primary text-white"
                isDisabled={isSubmitting}
              >
                Interested
              </Button>
            </Form>
          ) : null}
        </div>
        {props.hobbies.length &&
        props.movie_series.length &&
        props.sports.length &&
        props.travels.length ? (
          <details className="collapse collapse-arrow border border-base-300 bg-base-200">
            <summary className="collapse-title text-xl font-medium ">
              Interest
            </summary>
            <div className="flex flex-col gap-2 m-2 collapse-content">
              <InterestInfo
                hobbies={props.hobbies}
                movie_series={props.movie_series}
                sports={props.sports}
                travels={props.travels}
              />
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
