import { faker } from "@faker-js/faker";
import { customAlphabet } from "nanoid";

import type { Post, Task } from "./schema";
import { tasks } from "./schema";

export function generateRandomTask(): Omit<Task, "id"> {
  return {
    code: `TASK-${customAlphabet("0123456789", 4)()}`,
    title: faker.hacker
      .phrase()
      .replace(/^./, (letter) => letter.toUpperCase()),
    status: faker.helpers.shuffle(tasks.status.enumValues)[0] ?? "todo",
    label: faker.helpers.shuffle(tasks.label.enumValues)[0] ?? "bug",
    priority: faker.helpers.shuffle(tasks.priority.enumValues)[0] ?? "low",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateRandomPost(): Omit<Post, "id"> {
  return {
    title: faker.lorem.sentence(),
    status:
      faker.helpers.shuffle(["todo", "in-progress", "done", "canceled"])[0] ??
      "todo",
    author: faker.person.firstName(),
    nbComments: faker.number.int({ min: 0, max: 50 }),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function generateRandomUser() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    image: faker.image.avatar(),
  };
}

export function generateRandomComment() {
  return {
    id: faker.string.uuid(),
    postId: faker.string.uuid(),
    authorId: faker.string.uuid(),
    content: faker.lorem.sentences(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
