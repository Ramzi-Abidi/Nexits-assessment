import * as React from "react";

import { searchParamsSchema } from "@acme/db/schema";
import { DateRangePicker } from "@acme/ui/date-range-picker";
import { Shell } from "@acme/ui/shell";

import type { SearchParams } from "~/types";
import { DataTableSkeleton } from "~/components/data-table/data-table-skeleton";
import { PostsTable } from "../_components/posts-table";
import { getPosts, getViews } from "../_lib/queries";

export interface IndexPageProps {
  searchParams: SearchParams;
}

export default function IndexPage({ searchParams }: IndexPageProps) {
  const search = searchParamsSchema.parse(searchParams);

  const viewsPromise = getViews();
  const postsPromise = getPosts(search);

  return (
    <Shell className="gap-2">
      <React.Suspense
        fallback={
          <DataTableSkeleton
            columnCount={5}
            cellWidths={["10rem", "40rem", "12rem", "12rem", "8rem"]}
            shrinkZero
          />
        }
      >
        {/**
         * The `DateRangePicker` component is used to render the date range picker UI.
         * It is used to filter the tasks based on the selected date range it was created at.
         * The business logic for filtering the tasks based on the selected date range is handled inside the component.
         */}
        <DateRangePicker
          triggerSize="sm"
          triggerClassName="ml-auto w-56 sm:w-60 mr-1"
          className="dark:bg-background/95 dark:backdrop-blur-md dark:supports-[backdrop-filter]:bg-background/50"
          align="end"
        />
        {/**
         * Passing promises and consuming them using React.use for triggering the suspense fallback.
         * @see https://react.dev/reference/react/use
         */}
        <PostsTable postsPromise={postsPromise} viewsPromise={viewsPromise} />
      </React.Suspense>
    </Shell>
  );
}
