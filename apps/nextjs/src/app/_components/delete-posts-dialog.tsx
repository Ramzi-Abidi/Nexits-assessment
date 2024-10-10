"use client";

import type { Row } from "@tanstack/react-table";
import * as React from "react";
import { TrashIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import type { Post } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { LoaderIcon } from "@acme/ui/loader-icon";

import { deletePosts } from "../_lib/actions";

interface DeletePostsDialogProps
  extends React.ComponentPropsWithoutRef<typeof Dialog> {
  posts: Row<Post>["original"][];
  showTrigger?: boolean;
  onSuccess?: () => void;
}

export function DeletePostsDialog({
  posts,
  showTrigger = true,
  onSuccess,
  ...props
}: DeletePostsDialogProps) {
  const [isDeletePending, startDeleteTransition] = React.useTransition();

  return (
    <Dialog {...props}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <TrashIcon className="mr-2 size-4" aria-hidden="true" />
            Delete ({posts.length})
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your{" "}
            <span className="font-medium">{posts.length}</span>
            {posts.length === 1 ? " post" : " posts"} from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={() => {
              startDeleteTransition(async () => {
                const { error } = await deletePosts({
                  ids: posts.map((post) => post.id),
                });

                if (error) {
                  toast.error(error);
                  return;
                }

                props.onOpenChange?.(false);
                toast.success(`${posts.length > 1 ? "Posts" : "Post"} deleted`);
                onSuccess?.();
              });
            }}
            disabled={isDeletePending}
          >
            {isDeletePending && (
              <LoaderIcon
                className="mr-1.5 size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
