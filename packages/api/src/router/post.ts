import type { TRPCRouterRecord } from "@trpc/server";
import { and, asc, count, desc, gte, lte, sql } from "drizzle-orm"; // Adjust imports for your ORM
import { z } from "zod";

import type { Post } from "@acme/db/schema";
import { eq } from "@acme/db";
import { posts } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

export const postRouter = {
  getPosts: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        per_page: z.number().min(1).max(100).default(10),
        sort: z.string().optional(),
        title: z.string().optional(),
        status: z.string().optional(),
        from: z.string().optional(), // format: 'yyyy-mm-dd'
        to: z.string().optional(), // format: 'yyyy-mm-dd'
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, per_page, sort, title, status, from, to } = input;

      try {
        // Offset for pagination
        const offset = (page - 1) * per_page;

        const [column, order] = (sort?.split(".").filter(Boolean) ?? [
          "createdAt",
          "desc",
        ]) as [keyof Post | undefined, "asc" | "desc" | undefined];

        // Convert date strings to SQL date objects
        const fromDate = from ? sql`to_date(${from}, 'yyyy-mm-dd')` : undefined;
        const toDate = to ? sql`to_date(${to}, 'yyyy-mm-dd')` : undefined;

        const filters = [
          title ? sql`${posts.title} LIKE ${`%${title}%`}` : undefined,
          status ? sql`${posts.status} = ${status}` : undefined,
          fromDate && toDate
            ? and(gte(posts.createdAt, fromDate), lte(posts.createdAt, toDate))
            : undefined,
        ].filter(Boolean);

        // Combine filters with AND condition
        const where = filters.length > 0 ? and(...filters) : undefined;

        const { data, total } = await ctx.db.transaction(async (tx) => {
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

        // Calculate total page count
        const pageCount = Math.ceil(total / per_page);

        return { data, pageCount };
      } catch (error) {
        console.error(error);
        return { data: [], pageCount: 0 };
      }
    }),

  all: publicProcedure.query(async ({ ctx }) => {
    console.log("got here");

    const postsData = await ctx.db.query.posts.findMany({
      orderBy: desc(posts.id),
      limit: 10,
    });
    console.log(postsData);
    return {
      posts: postsData,
      total: postsData.length,
    };
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
      });
    }),

  // create: publicProcedure.input(CreatePostSchema).mutation(({ ctx, input }) => {
  //   return ctx.db.insert(posts).values(input);
  // }),

  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.db.delete(posts).where(eq(posts.id, input));
  }),
} satisfies TRPCRouterRecord;
