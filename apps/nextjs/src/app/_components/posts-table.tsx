"use client";

import React from "react";

import type { Post } from "@acme/db/schema";

import type { getPosts, getViews } from "../_lib/queries";
import type { DataTableFilterField } from "~/types";
import { DataTableAdvancedToolbar } from "~/components/data-table/advanced/data-table-advanced-toolbar";
import { DataTable } from "~/components/data-table/data-table";
import { TableInstanceProvider } from "~/components/data-table/table-instance-provider";
import { useDataTable } from "~/hooks/use-data-table";
import { getColumns } from "./posts-table-columns";
import { PostsTableFloatingBar } from "./posts-table-floating-bar";
import { PostsTableToolbarActions } from "./posts-table-toolbar-actions";

interface PostsTableProps {
  postsPromise: ReturnType<typeof getPosts>;
  viewsPromise: ReturnType<typeof getViews>;
}

export function PostsTable({ postsPromise, viewsPromise }: PostsTableProps) {
  const views = React.use(viewsPromise);
  const posts = React.use(postsPromise);

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
    data: posts.data,
    columns,
    pageCount: posts.pageCount,
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
