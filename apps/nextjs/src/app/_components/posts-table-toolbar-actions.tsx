"use client";

import type { Table } from "@tanstack/react-table";
import { DownloadIcon } from "@radix-ui/react-icons";
import { useHotkeys } from "react-hotkeys-hook";

import type { Post } from "@acme/db/schema"; // Adjust import as needed
import { Button } from "@acme/ui/button";
import { Kbd } from "@acme/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { exportTableToCSV } from "~/lib/export";

// import { CreatePostDialog } from "./create-post-dialog"; // Adjust import as needed
// import { DeletePostsDialog } from "./delete-posts-dialog"; // Adjust import as needed

interface PostsTableToolbarActionsProps {
  table: Table<Post>; // Change Task to Post
}

export function PostsTableToolbarActions({
  table,
}: PostsTableToolbarActionsProps) {
  useHotkeys("shift+e", () =>
    exportTableToCSV(table, {
      filename: "posts", // Change filename to "posts"
      excludeColumns: ["select", "actions"],
    }),
  );

  return (
    <div className="flex items-center gap-2">
      {/* {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeletePostsDialog
          posts={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null} */}
      {/* <CreatePostDialog /> */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportTableToCSV(table, {
                  filename: "posts", // Change filename to "posts"
                  excludeColumns: ["select", "actions"],
                })
              }
            >
              <DownloadIcon className="mr-2 size-4" aria-hidden="true" />
              Export
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2 border bg-accent font-semibold text-foreground dark:bg-background/95 dark:backdrop-blur-md dark:supports-[backdrop-filter]:bg-background/40">
            Export csv
            <div>
              <Kbd variant="outline">⇧</Kbd> <Kbd variant="outline">E</Kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/**
       * Other actions can be added here.
       * For example, import, view, etc.
       */}
    </div>
  );
}
