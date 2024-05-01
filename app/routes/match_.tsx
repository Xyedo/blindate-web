import type {
  ActionFunctionArgs,
  DataFunctionArgs,
  TypedResponse,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  Outlet,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import axios from "axios";
import clsx from "clsx";
import { Suspense, useEffect, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { apiError, guard } from "~/api/api";
import { Match, MatchForm } from "~/api/match";
import { MatchCard } from "~/routes/match_.$matchId";
import { ProfileHeader } from "~/routes/profile";

const errEmptyMatch = "empty candidate" as const;

export const loader = async (
  args: DataFunctionArgs
): Promise<{
  candidate?:
    | {
        status: "success";
        data: Match.IndexSchema["data"][0];
      }
    | {
        status: "error";
        errors: typeof errEmptyMatch;
      };
  liked?: Match.IndexSchema;
  accepted?: Match.IndexSchema;
}> => {
  const result = await guard(args);
  if (!result) {
    throw redirect("/sign-in");
  }

  const url = new URL(args.request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const filter = url.searchParams.get("filter");

  const pagination = { page, limit };
  const candidatePromise = Match.indexOrInsertCandidateIfEmpty(
    result.token,
    filter === "candidate" ? pagination : undefined
  )
    .then((v) => ({ status: "success" as const, result: v }))
    .catch((e) => {
      if (!axios.isAxiosError(e) || !e.response) {
        throw e;
      }

      const data = apiError.parse(e.response.data);
      if (!data.errors) {
        throw e;
      }

      if (e.response.status === 401) {
        if (data.errors[0].code === "EXPIRED_AUTH") {
          throw redirect("/match");
        }
      }

      if (e.response.status === 404) {
        if (data.errors[0].code === "MATCH_CANDIDATE_EMPTY") {
          return {
            status: "error" as const,
            errors: errEmptyMatch,
          };
        }

        if (data.errors[0].code === "USER_NOT_FOUND") {
          throw redirect("/profile/edit");
        }
      }

      throw e;
    });

  const likedPromise = Match.index(
    result.token,
    "likes",
    filter === "likes" ? pagination : undefined
  ).catch((e) => {
    if (!axios.isAxiosError(e) || !e.response) {
      throw e;
    }

    const data = apiError.parse(e.response.data);
    if (!data.errors) {
      throw e;
    }

    if (e.response.status === 401) {
      if (data.errors[0].code === "EXPIRED_AUTH") {
        throw redirect("/match");
      }
    }
    throw e;
  });

  const acceptedPromise = Match.index(
    result.token,
    "accepted",
    filter === "accepted" ? pagination : undefined
  ).catch((e) => {
    if (!axios.isAxiosError(e) || !e.response) {
      throw e;
    }

    const data = apiError.parse(e.response.data);
    if (!data.errors) {
      throw e;
    }

    if (e.response.status === 401) {
      if (data.errors[0].code === "EXPIRED_AUTH") {
        throw redirect("/match");
      }
    }
    throw e;
  });

  const [candidate, liked, accepted] = await Promise.allSettled([
    candidatePromise,
    likedPromise,
    acceptedPromise,
  ]);

  const res: {
    candidate?:
      | {
          status: "success";
          data: Match.IndexSchema["data"][0];
        }
      | {
          status: "error";
          errors: typeof errEmptyMatch;
        };
    liked?: Match.IndexSchema;
    accepted?: Match.IndexSchema;
  } = {
    candidate: undefined,
    liked: undefined,
    accepted: undefined,
  };

  if (candidate.status === "fulfilled") {
    if (candidate.value.status === "error") {
      res.candidate = {
        status: "error",
        errors: errEmptyMatch,
      };
    } else {
      res.candidate = {
        status: "success",
        data: candidate.value.result.data[0],
      };
    }
  }

  if (liked.status === "fulfilled") {
    res.liked = liked.value;
  }

  if (accepted.status === "fulfilled") {
    res.accepted = accepted.value;
  }

  return res;
};

export const action = async (
  args: ActionFunctionArgs
): Promise<TypedResponse<null>> => {
  const result = await guard(args);
  if (!result) {
    throw redirect("/sign-in");
  }

  const form = Object.fromEntries(await args.request.formData());

  const payload = MatchForm.swipeSchema.parse(form);

  await Match.swipe(result.token, payload.matchId, {
    swipe: payload.swipe,
  });

  return json(null);
};
export default function MatchPage() {
  const { accepted, candidate, liked } = useLoaderData<typeof loader>();
  return (
    <>
      <Suspense>
        <Outlet />
        <div className="m-4">
          <AcceptedCard accepted={accepted} />
          <div className="divider" />
          {candidate?.status === "success" && candidate.data ? (
            <>
              <MatchCard {...candidate.data} status="likes" />
              <div className="divider" />
            </>
          ) : (
            <EmptyMatchCandidate />
          )}

          <LikedCard liked={liked} />
        </div>
      </Suspense>
    </>
  );
}

type AcceptedProps = { accepted?: Match.IndexSchema };

function AcceptedCard({ accepted }: AcceptedProps) {
  const [acceptedMatch, setAcceptedMatch] = useState<Match.IndexSchema["data"]>(
    accepted ? accepted.data : []
  );
  const acceptedFetcher = useFetcher<Match.IndexSchema>();

  const next = acceptedFetcher.data?.metadata?.next
    ? acceptedFetcher.data.metadata.next
    : accepted?.metadata.next ?? null;

  const [infiniteRef, { rootRef }] = useInfiniteScroll({
    hasNextPage: !!next,
    loading: acceptedFetcher.state === "submitting",
    onLoadMore: () => {
      if (!next) return;
      acceptedFetcher.load(`${next}&filter=accepted`);
    },
  });

  useEffect(() => {
    if (!acceptedFetcher.data?.data || acceptedFetcher.state === "loading") {
      return;
    }
    if (acceptedFetcher.data?.data) {
      const newData = acceptedFetcher.data.data;
      setAcceptedMatch((prevData) => [...prevData, ...newData]);
    }
  }, [acceptedFetcher.data?.data, acceptedFetcher.state]);

  return (
    <div
      ref={rootRef}
      className="flex flex-row flex-nowrap overflow-auto space-x-2 "
    >
      {acceptedMatch.map((v) => {
        if (!v) {
          return null;
        }

        return (
          <Link key={v.id} to={`${v.id}`}>
            <div
              className={clsx(
                "avatar",
                !v.profile_picture_urls.length ? "placeholder" : null
              )}
            >
              {v.profile_picture_urls.length ? (
                <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={v.profile_picture_urls[0]} alt="profile" />
                </div>
              ) : (
                <div className="bg-neutral text-neutral-content rounded-full w-16">
                  <span className="text-xl">{v.alias[0]}</span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
      {(acceptedFetcher.state === "submitting" || next) && (
        <div ref={infiniteRef} className="flex justify-center items-center">
          <div className="loader loader-dots" />
        </div>
      )}
    </div>
  );
}

function LikedCard({ liked }: { liked?: Match.IndexSchema }) {
  const [likedMatch, setLikedMatch] = useState<Match.IndexSchema["data"]>(
    liked ? liked.data : []
  );
  const likedFetcher = useFetcher<Match.IndexSchema>();

  const next = likedFetcher.data?.metadata?.next
    ? likedFetcher.data.metadata.next
    : liked?.metadata.next ?? null;

  const [infiniteRef, { rootRef }] = useInfiniteScroll({
    hasNextPage: !!next,
    loading: likedFetcher.state === "submitting",
    onLoadMore: () => {
      if (!next) return;
      likedFetcher.load(`${next}&filter=liked`);
    },
  });

  useEffect(() => {
    if (!likedFetcher.data?.data || likedFetcher.state === "loading") {
      return;
    }
    if (likedFetcher.data?.data) {
      const newData = likedFetcher.data.data;
      setLikedMatch((prevData) => [...prevData, ...newData]);
    }
  }, [likedFetcher.data?.data, likedFetcher.state]);

  return (
    <div ref={rootRef} className="flex flex-wrap justify-evenly gap-4">
      {likedMatch.map((v) => {
        if (!v) {
          return null;
        }

        return (
          <Link key={v.id} to={`${v.id}`}>
            <div
              className={clsx(
                "card bg-base-200 shadow-xl max-w-[10rem]",
                v.profile_picture_urls.length > 0 && "image-full"
              )}
            >
              {v.profile_picture_urls.length > 0 ? (
                <figure>
                  <img src={v.profile_picture_urls[0]} alt="Profile" />
                </figure>
              ) : null}

              <div className="card-body">
                <h2 className="card-title">{v.alias}</h2>
                {v.distance ? (
                  <p className="text-sm">{v.distance.toFixed(3)} km Away</p>
                ) : null}

                <ProfileHeader
                  bio={v.bio}
                  gender={v.gender}
                  work={v.work}
                  education_level={v.education_level}
                />
              </div>
            </div>
          </Link>
        );
      })}
      {(likedFetcher.state === "submitting" || next) && (
        <div ref={infiniteRef} className="flex justify-center items-center">
          <div className="loader loader-dots" />
        </div>
      )}
    </div>
  );
}



function EmptyMatchCandidate() {
  return (
    <div className="h-full flex justify-center items-center mx-7">
      <div className="card w-96 bg-base-200 shadow-xl justify-center items-center">
        <div className="card-body">
          <h2 className="card-title"> Damn you're Early</h2>
          <p>we have no Users~ Tehe Please Dont Angry and Try again later</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary text-gray-50">
              Smash this instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
