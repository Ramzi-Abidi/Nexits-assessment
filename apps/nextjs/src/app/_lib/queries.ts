import "server-only";

import type { SQL } from "drizzle-orm";
import { unstable_noStore as noStore } from "next/cache";
import { and, asc, count, desc, gte, lte, or, sql } from "drizzle-orm";

import type {
  GetPostsSchema,
  GetTasksSchema,
  Post,
  Task,
} from "@acme/db/schema";
import { db } from "@acme/db/client";
import { posts, tasks, views } from "@acme/db/schema";

import type { DrizzleWhere } from "~/types";
import { filterColumn } from "~/lib/filter-column";

export async function getTasks(input: GetTasksSchema) {
  noStore();
  const { page, per_page, sort, title, status, priority, operator, from, to } =
    input;

  try {
    // Offset to paginate the results
    const offset = (page - 1) * per_page;
    // Column and order to sort by
    // Spliting the sort string by "." to get the column and order
    // Example: "title.desc" => ["title", "desc"]
    const [column, order] = (sort?.split(".").filter(Boolean) ?? [
      "createdAt",
      "desc",
    ]) as [keyof Task | undefined, "asc" | "desc" | undefined];

    // Convert the date strings to date objects
    const fromDay = from ? sql`to_date(${from}, 'yyyy-mm-dd')` : undefined;
    const toDay = to ? sql`to_date(${to}, 'yyyy-mm-dd')` : undefined;

    const expressions: (SQL<unknown> | undefined)[] = [
      title
        ? filterColumn({
            column: tasks.title,
            value: title,
          })
        : undefined,
      // Filter tasks by status
      status
        ? filterColumn({
            column: tasks.status,
            value: status,
            isSelectable: true,
          })
        : undefined,
      // Filter tasks by priority
      priority
        ? filterColumn({
            column: tasks.priority,
            value: priority,
            isSelectable: true,
          })
        : undefined,
      // Filter by createdAt
      fromDay && toDay
        ? and(gte(tasks.createdAt, fromDay), lte(tasks.createdAt, toDay))
        : undefined,
    ];
    const where: DrizzleWhere<Task> =
      !operator || operator === "and"
        ? and(...expressions)
        : or(...expressions);

    // Transaction is used to ensure both queries are executed in a single transaction
    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(tasks)
        .limit(per_page)
        .offset(offset)
        .where(where)
        .orderBy(
          column && column in tasks
            ? order === "asc"
              ? asc(tasks[column])
              : desc(tasks[column])
            : desc(tasks.id),
        );

      const total = await tx
        .select({
          count: count(),
        })
        .from(tasks)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return {
        data,
        total,
      };
    });

    const pageCount = Math.ceil(total / per_page);
    return { data, pageCount };
  } catch {
    return { data: [], pageCount: 0 };
  }
}

export async function getTaskCountByStatus() {
  noStore();
  try {
    return await db
      .select({
        status: tasks.status,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.status)
      .execute();
  } catch {
    return [];
  }
}

export async function getTaskCountByPriority() {
  noStore();
  try {
    return await db
      .select({
        priority: tasks.priority,
        count: count(),
      })
      .from(tasks)
      .groupBy(tasks.priority)
      .execute();
  } catch {
    return [];
  }
}

export async function getViews() {
  noStore();
  return await db
    .select({
      id: views.id,
      name: views.name,
      columns: views.columns,
      filterParams: views.filterParams,
    })
    .from(views)
    .orderBy(desc(views.createdAt));
}

export async function getPosts({
  page,
  per_page,
  sort,
  title,
  status,
  from,
  to,
}: GetPostsSchema) {
  try {
    noStore();
    const offset = (page - 1) * per_page;
    const [column, order] = (sort?.split(".").filter(Boolean) ?? [
      "createdAt",
      "desc",
    ]) as [keyof Post | undefined, "asc" | "desc" | undefined];

    const fromDate = from ? sql`to_date(${from}, 'yyyy-mm-dd')` : undefined;
    const toDate = to ? sql`to_date(${to}, 'yyyy-mm-dd')` : undefined;

    // Build filter expressions
    const filters = [
      title ? sql`${posts.title} LIKE ${`%${title}%`}` : undefined,
      status ? sql`${posts.status} = ${status}` : undefined,
      fromDate && toDate
        ? and(
            sql`${posts.createdAt} >= ${fromDate}`,
            sql`${posts.createdAt} <= ${toDate}`,
          )
        : undefined,
    ].filter(Boolean);

    const where = filters.length > 0 ? and(...filters) : undefined;
    console.log(column);
    // Fetch paginated posts data
    const { data, total } = await db.transaction(async (tx) => {
      const data = await tx
        .select()
        .from(posts)
        .where(where)
        .limit(per_page)
        .offset(offset)
        .orderBy(
          column && column in posts
            ? order === "asc"
              ? asc(posts[column])
              : desc(posts[column])
            : desc(posts.id),
        );

      const total = await tx
        .select({
          count: count(),
        })
        .from(posts)
        .where(where)
        .execute()
        .then((res) => res[0]?.count ?? 0);

      return { data, total };
    });

    const pageCount = Math.ceil(total / per_page);
    return { data, pageCount };
  } catch {
    return { data: [], pageCount: 0 };
  }
}
