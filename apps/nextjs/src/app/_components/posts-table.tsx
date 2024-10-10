"use client";

import React from "react";

import type { Post } from "@acme/db/schema";

import type { getViews } from "../_lib/queries";
import type { DataTableFilterField } from "~/types";
import { DataTableAdvancedToolbar } from "~/components/data-table/advanced/data-table-advanced-toolbar";
import { DataTable } from "~/components/data-table/data-table";
import { TableInstanceProvider } from "~/components/data-table/table-instance-provider";
import { useDataTable } from "~/hooks/use-data-table";
import { api } from "~/trpc/react";
import { getColumns } from "./posts-table-columns";
import { PostsTableFloatingBar } from "./posts-table-floating-bar";
import { PostsTableToolbarActions } from "./posts-table-toolbar-actions";

interface ISearch {
  page: number;
  per_page: number;
  status?: string | undefined;
  title?: string | undefined;
  sort?: string | undefined;
  priority?: string | undefined;
  operator?: "and" | "or" | undefined;
  from?: string | undefined;
  to?: string | undefined;
  viewId?: string | undefined;
}

interface PostsTableProps {
  search: ISearch;
  viewsPromise: ReturnType<typeof getViews>;
}

export function PostsTable({ search, viewsPromise }: PostsTableProps) {
  const views = React.use(viewsPromise);

  // Query to fetch all posts
  const { data: posts } = api.post.getPosts.useQuery(search);

  const postData = posts?.data ?? [];
  const totalPosts = posts?.pageCount ?? 0;

  // Memoize the columns so they don't re-render on every render
  const columns = React.useMemo(() => getColumns(), []);

  const filterFields: DataTableFilterField<Post>[] = [
    {
      label: "Title",
      value: "title",
      placeholder: "Filter titles...",
    },
    {
      label: "Status",
      value: "status",
    },
  ];

  const { table } = useDataTable({
    data: postData,
    columns,
    pageCount: totalPosts,
    filterFields,
    defaultPerPage: 10,
    defaultSort: "createdAt.desc",
  });

  return (
    <TableInstanceProvider table={table}>
      <DataTable
        table={table}
        floatingBar={<PostsTableFloatingBar table={table} />}
      >
        <DataTableAdvancedToolbar filterFields={filterFields} views={views}>
          <PostsTableToolbarActions table={table} />
        </DataTableAdvancedToolbar>
      </DataTable>
    </TableInstanceProvider>
  );
}
