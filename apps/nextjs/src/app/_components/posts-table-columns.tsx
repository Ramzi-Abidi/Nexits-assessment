"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";

import type { Post } from "@acme/db/schema";
import { posts } from "@acme/db/schema";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { DataTableColumnHeader } from "~/components/data-table/data-table-column-header";
import { formatDate } from "~/lib/utils";
import { getStatusIcon } from "../_lib/utils";
import { DeletePostsDialog } from "./delete-posts-dialog";
import { UpdatePostSheet } from "./update-post-sheet";

export function getColumns(): ColumnDef<Post>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Title" />
      ),
      cell: ({ row }) => (
        <div className="w-40 truncate">{row.getValue("title")}</div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "author",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Author" />
      ),
      cell: ({ row }) => <div>{row.getValue("author")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "nbComments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Comments" />
      ),
      cell: ({ row }) => <div>{row.getValue("nbComments")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = posts.status.enumValues.find(
          (status) => status === row.original.status,
        );

        if (!status) return null;

        const Icon = getStatusIcon(status);

        return (
          <div className="flex items-center">
            <Icon
              className="mr-2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ cell }) => formatDate(cell.getValue() as Date),
    },
    {
      id: "actions",
      cell: function Cell({ row }) {
        const [isUpdatePending, startUpdateTransition] = React.useTransition();
        const [showUpdatePostSheet, setShowUpdatePostSheet] =
          React.useState(false);
        const [showDeletePostDialog, setShowDeletePostDialog] =
          React.useState(false);

        const handleEdit = () => {
          startUpdateTransition(() => {
            setShowUpdatePostSheet(true);
          });
        };

        const handleDelete = () => {
          startUpdateTransition(() => {
            setShowDeletePostDialog(true);
          });
        };

        return (
          <>
            <UpdatePostSheet
              open={showUpdatePostSheet}
              onOpenChange={setShowUpdatePostSheet}
              post={row.original}
            />
            <DeletePostsDialog
              open={showDeletePostDialog}
              onOpenChange={setShowDeletePostDialog}
              posts={[row.original]}
              showTrigger={false}
              onSuccess={() => row.toggleSelected(false)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open menu"
                  variant="ghost"
                  className="flex size-8 p-0 data-[state=open]:bg-muted"
                  disabled={isUpdatePending} // Disable button if update is pending
                >
                  <DotsHorizontalIcon className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 overflow-visible dark:bg-background/95 dark:backdrop-blur-md dark:supports-[backdrop-filter]:bg-background/40"
              >
                <DropdownMenuItem onSelect={handleEdit}>
                  {isUpdatePending ? "Updating..." : "Edit"}{" "}
                  {/* Conditional rendering */}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleDelete}
                  disabled={isUpdatePending} // Disable delete button if update is pending
                >
                  Delete
                  <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        );
      },
    },
  ];
}
