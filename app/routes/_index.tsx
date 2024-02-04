import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import axios from "axios";
import clsx from "clsx";
import { Fragment } from "react";
import { apiError, guard } from "~/api/api";
import { Conversation } from "~/api/conversation";
import { User } from "~/api/user";
import { Input } from "react-aria-components";
import { IconContext } from "react-icons";
import { IoMdSearch } from "react-icons/io/index.js";

export const meta: MetaFunction = () => {
  return [
    { title: "Blindate" },
    { name: "description", content: "Welcome to Remix!" },
    {},
  ];
};

export const loader = async (
  args: LoaderFunctionArgs
): Promise<{
  userDetail?: User.Schema;
  conversation: {
    metadata?: Conversation.Index["metadata"];
    emptyConversations?: Conversation.Index["data"];
    ongoingConversations?: Conversation.Index["data"];
  };
}> => {
  const result = await guard(args);
  if (!result) {
    throw redirect("/sign-in");
  }
  //TODO: Get All Conversation, UserDetail, Match
  const userDetailPromise = User.getDetail(result.token, result.userId).catch(
    (e) => {
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
          throw redirect("/");
        }
      }

      throw e;
    }
  );

  const conversationsPromise = Conversation.list(result.token).catch((e) => {
    if (!axios.isAxiosError(e) || !e.response) {
      throw e;
    }
    const data = apiError.parse(e.response.data);
    if (!data.errors) {
      throw e;
    }
    if (e.response.status === 401) {
      if (data.errors[0].code === "EXPIRED_AUTH") {
        throw redirect("/");
      }
    }

    throw e;
  });

  const [userDetail, conversations] = await Promise.allSettled([
    userDetailPromise,
    conversationsPromise,
  ]);
  const resp: { userDetail?: User.Schema; conversations?: Conversation.Index } =
    {};

  if (userDetail.status === "fulfilled") {
    resp.userDetail = userDetail.value;
  }

  if (conversations.status === "fulfilled") {
    resp.conversations = conversations.value;
  }

  const emptyConversations = resp.conversations?.data.filter(
    (v) => v && v.last_chat.id === null
  );

  const ongoingConversations = resp.conversations?.data.filter(
    (v) => v && v.last_chat.id !== null
  );

  return {
    userDetail: resp.userDetail,
    conversation: {
      metadata: resp.conversations?.metadata,
      emptyConversations,
      ongoingConversations,
    },
  };
};

export default function Index() {
  const { userDetail, conversation } = useLoaderData<typeof loader>();
  const selectedUserPhoto = userDetail?.profile_picture_urls[0];
  return (
    <div className="min-h-screen">
      <header className="flex flex-row m-4">
        <div className="basis-1/4 flex flex-row items-center justify-center">
          <div className="avatar online">
            <div className="w-16 rounded-full ring ring-primary ring-offset-base-100">
              {selectedUserPhoto ? (
                <img src={selectedUserPhoto} alt="profile" />
              ) : (
                // TODO: api to make anonymous unique avatar
                <img
                  src="https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
                  alt="profile-default"
                />
              )}
            </div>
          </div>
          <div className="divider divider-horizontal" />
        </div>
        <div className="flex flex-nowrap overflow-auto space-x-2 z-10">
          {conversation.emptyConversations?.map((v) => (
            <Fragment key={v.id}>
              <div
                className={clsx(
                  "avatar",
                  !v.recepient.url ? "placeholder" : null
                )}
              >
                {v.recepient.url ? (
                  <div className="w-16 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={v.recepient.url} alt="profile" />
                  </div>
                ) : (
                  <div className="bg-neutral text-neutral-content rounded-full w-16">
                    <span className="text-xl">
                      {v.recepient.display_name[0]}
                    </span>
                  </div>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </header>
      <div className="divider" />
      <main className="m-4">
        <div className="flex justify-center items-center">
          <div className="join border input-bordered w-full max-w-xs">
            <div className="join-item m-auto ml-2">
              <IconContext.Provider
                value={{ color: "white", className: "w-8 h-8" }}
              >
                <IoMdSearch />
              </IconContext.Provider>
            </div>
            <Input
              type="text"
              placeholder="Search"
              className="input w-full join-item"
            />
          </div>
        </div>
        <section className="my-4">
          {conversation.ongoingConversations?.map((convo) => (
            <Fragment key={convo.id}>
              <div className="flex flex-row cursor-pointer">
                <div
                  className={clsx(
                    "avatar basis-1/5 items-center",
                    !convo.recepient.url ? "placeholder" : null
                  )}
                >
                  {convo.recepient.url ? (
                    <div className="w-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img src={convo.recepient.url} alt="profile" />
                    </div>
                  ) : (
                    <div className="bg-neutral text-neutral-content rounded-full w-14">
                      <span className="text-xl">
                        {convo.recepient.display_name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg text-white">
                    {convo.recepient.display_name}
                  </h2>
                  <p className="overflow-clip">{convo.last_chat.message}</p>
                  <p className="text-sm">
                    {convo.last_chat.updated_at
                      ? new Date(convo.last_chat.updated_at).toLocaleTimeString(
                          undefined,
                          { timeStyle: "short" }
                        )
                      : convo.last_chat.sent_at
                      ? new Date(convo.last_chat.sent_at).toLocaleTimeString(
                          undefined,
                          { timeStyle: "short" }
                        )
                      : null}
                  </p>
                </div>
              </div>
            </Fragment>
          ))}
        </section>
      </main>
    </div>
  );
}
