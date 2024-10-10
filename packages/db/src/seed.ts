import type { Task } from "./schema";
import { db } from "./client";
import { comments, posts, tasks, users } from "./schema";
import {
  generateRandomComment,
  generateRandomPost,
  generateRandomTask,
  generateRandomUser,
} from "./util";

async function seedTasks(input: { count: number }) {
  const count = input.count;
  try {
    const allTasks: Omit<Task, "id">[] = [];

    for (let i = 0; i < count; i++) {
      allTasks.push(generateRandomTask());
    }

    await db.delete(tasks);

    console.log("📝 Inserting tasks", allTasks.length);

    await db.insert(tasks).values(allTasks);
  } catch (err) {
    console.error(err);
  }
}

async function _seedPosts(_input: { count: number }) {
  const count = _input.count; // Default to 100 if no count is provided
  const allPosts = [];

  try {
    for (let i = 0; i < count; i++) {
      allPosts.push(generateRandomPost());
    }

    console.log("📝 Inserting posts", allPosts.length);
    await db.delete(posts);

    await db.insert(posts).values(allPosts);
  } catch (err) {
    console.error(err);
  }
}

async function _seedUsers(_input: { count: number }) {
  const count = _input.count; // Default to 100 if no count is provided
  const allUsers = [];

  try {
    for (let i = 0; i < count; i++) {
      allUsers.push(generateRandomUser());
    }

    console.log("📝 Inserting users", allUsers.length);
    await db.delete(users);

    await db.insert(users).values(allUsers);
  } catch (err) {
    console.error(err);
  }
}

async function _seedComments(_input: { count: number }) {
  const count = _input.count; // Default to 100 if no count is provided
  const allComments = [];

  try {
    for (let i = 0; i < count; i++) {
      allComments.push(generateRandomComment());
    }
    console.log("📝 Inserting comments", allComments.length);
    await db.delete(comments);

    await db.insert(comments).values(allComments);
  } catch (err) {
    console.error(err);
  }
}

async function runSeed() {
  console.log("⏳ Running seed...");

  const start = Date.now();

  const seedCount = 100;

  // Run all seeds concurrently
  await Promise.all([
    seedTasks({ count: seedCount }),
    _seedPosts({ count: seedCount }),
    _seedUsers({ count: seedCount }),
    _seedComments({ count: seedCount }),
  ]);

  const end = Date.now();

  console.log(`✅ Seed completed in ${end - start}ms`);

  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed failed");
  console.error(err);
  process.exit(1);
});
