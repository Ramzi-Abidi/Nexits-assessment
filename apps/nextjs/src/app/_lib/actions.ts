"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { asc, eq, inArray, not } from "drizzle-orm";
import { customAlphabet } from "nanoid";

import type {
  CreatePostSchema,
  CreateTaskSchema,
  CreateViewSchema,
  DeleteViewSchema,
  EditViewSchema,
  Task,
  UpdateTaskSchema,
} from "@acme/db/schema";
import { db, takeFirstOrThrow } from "@acme/db/client";
import {
  createViewSchema,
  deleteViewSchema,
  editViewSchema,
  posts,
  tasks,
  views,
} from "@acme/db/schema";
import { generateRandomPost, generateRandomTask } from "@acme/db/util";

import type { ViewItem } from "~/components/data-table/advanced/views/data-table-views-dropdown";
import { getErrorMessage } from "~/lib/handle-error";

export interface CreateFormState<T> {
  status?: "success" | "error";
  message?: string;
  errors?: Partial<Record<keyof T, string>>;
}

export async function createTask(input: CreateTaskSchema) {
  noStore();
  try {
    await db.transaction(async (tx) => {
      const newTask = await tx
        .insert(tasks)
        .values({
          code: `TASK-${customAlphabet("0123456789", 4)()}`,
          title: input.title,
          status: input.status,
          label: input.label,
          priority: input.priority,
        })
        .returning({
          id: tasks.id,
        })
        .then(takeFirstOrThrow);

      // Delete a task to keep the total number of tasks constant
      await tx.delete(tasks).where(
        eq(
          tasks.id,
          (
            await tx
              .select({
                id: tasks.id,
              })
              .from(tasks)
              .limit(1)
              .where(not(eq(tasks.id, newTask.id)))
              .orderBy(asc(tasks.createdAt))
              .then(takeFirstOrThrow)
          ).id,
        ),
      );
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function createPost(input: CreatePostSchema) {
  noStore();
  try {
    const status =
      input.status === "todo" ||
      input.status === "in-progress" ||
      input.status === "done" ||
      input.status === "canceled"
        ? input.status
        : "todo";

    await db.transaction(async (tx) => {
      const newPost = await tx
        .insert(posts)
        .values({
          title: input.title,
          author: input.author,
          status: status,
          nbComments: input.nbComments ?? 0,
        })
        .returning({
          id: posts.id,
        })
        .then(takeFirstOrThrow);

      // Optional logic: for example, limiting the number of posts by deleting old ones
      await tx.delete(posts).where(
        eq(
          posts.id,
          (
            await tx
              .select({
                id: posts.id,
              })
              .from(posts)
              .limit(1)
              .where(not(eq(posts.id, newPost.id)))
              .orderBy(asc(posts.createdAt))
              .then(takeFirstOrThrow)
          ).id,
        ),
      );
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTask(input: UpdateTaskSchema & { id: string }) {
  noStore();
  try {
    await db
      .update(tasks)
      .set({
        title: input.title,
        label: input.label,
        status: input.status,
        priority: input.priority,
      })
      .where(eq(tasks.id, input.id));

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updatePost(input: any) {
  noStore();
  try {
    await db
      .update(tasks)
      .set({
        title: input.title,
        status: input.status,
        priority: input.priority,
      })
      .where(eq(tasks.id, input.id));

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updateTasks(input: {
  ids: string[];
  label?: Task["label"];
  status?: Task["status"];
  priority?: Task["priority"];
}) {
  noStore();
  try {
    await db
      .update(tasks)
      .set({
        label: input.label,
        status: input.status,
        priority: input.priority,
      })
      .where(inArray(tasks.id, input.ids));

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function updatePosts(input: {
  ids: string[];
  title?: string;
  status?: "todo" | "in-progress" | "done" | "canceled";
}) {
  noStore();
  try {
    await db
      .update(posts)
      .set({
        title: input.title,
        status: input.status,
      })
      .where(inArray(posts.id, input.ids));

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteTask(input: { id: string }) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(tasks).where(eq(tasks.id, input.id));

      // Create a new task for the deleted one
      await tx.insert(tasks).values(generateRandomTask());
    });

    revalidatePath("/");
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deleteTasks(input: { ids: string[] }) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(tasks).where(inArray(tasks.id, input.ids));

      // Create new tasks for the deleted ones
      await tx.insert(tasks).values(input.ids.map(() => generateRandomTask()));
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

export async function deletePosts(input: { ids: string[] }) {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(posts).where(inArray(posts.id, input.ids));

      // Create new posts for the deleted ones
      // await tx.insert(posts).values(input.ids.map(() => generateRandomPost()));
    });

    revalidatePath("/");

    return {
      data: null,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
    };
  }
}

type CreateViewFormState = CreateFormState<CreateViewSchema> & {
  view?: ViewItem;
};

export async function createView(
  _prevState: CreateViewFormState,
  formData: FormData,
): Promise<CreateViewFormState> {
  noStore();

  const name = formData.get("name");
  const columns = (
    formData.get("columns")
      ? JSON.parse(formData.get("columns") as string)
      : undefined
  ) as string[] | undefined;
  const filterParams = (
    formData.get("filterParams")
      ? JSON.parse(formData.get("filterParams") as string)
      : undefined
  ) as {
    operator?: "and" | "or";
    sort?: string;
    filters?: {
      field: "title" | "status" | "priority";
      value: string;
      isMulti: boolean;
    }[];
  };

  const validatedFields = createViewSchema.safeParse({
    name,
    columns,
    filterParams,
  });

  if (!validatedFields.success) {
    const errorMap = validatedFields.error.flatten().fieldErrors;
    return {
      status: "error",
      message: errorMap.name?.[0] ?? "",
    };
  }

  let viewId = "";

  try {
    await db.transaction(async (tx) => {
      const newView = await tx
        .insert(views)
        .values({
          name: validatedFields.data.name,
          columns: validatedFields.data.columns,
          filterParams: validatedFields.data.filterParams,
        })
        .returning({
          id: views.id,
        })
        .then(takeFirstOrThrow);

      viewId = newView.id;

      const allViews = await db.select({ id: views.id }).from(views);
      if (allViews.length >= 10) {
        await tx.delete(views).where(
          eq(
            views.id,
            (
              await tx
                .select({
                  id: views.id,
                })
                .from(views)
                .limit(1)
                .where(not(eq(views.id, newView.id)))
                .orderBy(asc(views.createdAt))
                .then(takeFirstOrThrow)
            ).id,
          ),
        );
      }
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "View created",
      view: {
        id: viewId,
        name: validatedFields.data.name,
        columns: validatedFields.data.columns ?? null,
        filterParams: validatedFields.data.filterParams ?? null,
      },
    };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err),
    };
  }
}

type EditViewFormState = CreateFormState<EditViewSchema>;

interface FilterParams {
  operator?: "and" | "or";
  sort?: string;
  filters?: {
    field: "title" | "status" | "priority";
    value: string;
    isMulti: boolean;
  }[];
}

export async function editView(
  _prevState: EditViewFormState,
  formData: FormData,
): Promise<EditViewFormState> {
  noStore();

  const id = formData.get("id");
  const name = formData.get("name");
  const columns = (
    formData.get("columns")
      ? JSON.parse(formData.get("columns") as string)
      : undefined
  ) as string[] | undefined;
  const filterParams = (
    formData.get("filterParams")
      ? JSON.parse(formData.get("filterParams") as string)
      : undefined
  ) as FilterParams | undefined;

  const validatedFields = editViewSchema.safeParse({
    id,
    name,
    columns,
    filterParams,
  });

  if (!validatedFields.success) {
    const errorMap = validatedFields.error.flatten().fieldErrors;
    return {
      status: "error",
      message: errorMap.name?.[0] ?? "",
    };
  }

  try {
    await db
      .update(views)
      .set({
        name: validatedFields.data.name,
        columns: validatedFields.data.columns,
        filterParams: validatedFields.data.filterParams,
      })
      .where(eq(views.id, validatedFields.data.id));

    revalidatePath("/");

    return {
      status: "success",
      message: "View updated",
    };
  } catch (err) {
    return {
      status: "error",
      message: getErrorMessage(err),
    };
  }
}

export async function deleteView(input: DeleteViewSchema) {
  noStore();

  try {
    await db.delete(views).where(eq(views.id, input.id));
    revalidatePath("/");
    return {
      data: null,
      error: null,
      message: "View deleted successfully",
      status: "success",
    };
  } catch (err) {
    return {
      data: null,
      error: getErrorMessage(err),
      message: "Error deleting view",
      status: "error",
    };
  }
}
