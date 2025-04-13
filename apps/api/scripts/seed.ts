/* eslint-disable node/no-process-env */
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { reset, seed } from "drizzle-seed";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import pg from "pg";

import * as schema from "../src/db/schema/index.js";

// Simple password hash function for seeding purposes
function hashPassword(password: string): { hash: string; salt: string } {
    const salt = randomBytes(32).toString("hex");
    const hash = pbkdf2Sync(
        password,
        salt,
        10000,
        64,
        "sha512",
    ).toString("hex");

    return { hash, salt };
}

async function main() {
    // Create a connection to your database
    const pool = new pg.Pool({
        host: process.env.POSTGRES_HOST || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: process.env.POSTGRES_DB || "dipcord",
    });

    const db = drizzle(pool, { schema });
    console.log("Connected to database, starting seed process...");

    // Reset database before seeding to avoid duplicate key violations
    console.log("Resetting database tables...");
    try {
        // Manually truncate all tables in proper order to avoid constraint issues
        // First, clear all message-related and member-related tables that have foreign keys
        await db.execute(sql`TRUNCATE TABLE poll_votes, poll_options, polls, task_calendar_events, tasks, 
                             channel_members, channel_invites, messages CASCADE`);

        // Then clear the main tables
        await db.execute(sql`TRUNCATE TABLE users, channels CASCADE`);

        console.log("Database reset successful.");
    }
    catch (error) {
        console.error("Error resetting database:", error);
        console.log("Continuing with seed process...");
    }

    // Generate consistent password for all seeded users for easy testing
    const standardPassword = hashPassword("Password123!");
    const adminPassword = hashPassword("AdminPass123!");

    // Create a schema subset that excludes problematic tables
    const {
        pollVotes,
        pollOptions,
        polls,
        taskCalendarEvents,
        tasks,
        channelMembers, // Exclude channel members to manage manually
        ...schemaToSeed
    } = schema;

    // Seeding the database, excluding problematic tables
    await seed(db, schemaToSeed).refine(f => ({
        // Seed users
        users: {
            count: 12,
            columns: {
                name: f.firstName(),
                surname: f.lastName(),
                email: f.email(),
                username: f.fullName(),
                roles: f.weightedRandom([
                    { weight: 0.25, value: f.default({ defaultValue: ["admin", "user"] }) },
                    { weight: 0.75, value: f.default({ defaultValue: ["user"] }) },
                ]),
                passwordHash: f.weightedRandom([
                    { weight: 0.25, value: f.default({ defaultValue: adminPassword.hash }) },
                    { weight: 0.75, value: f.default({ defaultValue: standardPassword.hash }) },
                ]),
                passwordSalt: f.weightedRandom([
                    { weight: 0.25, value: f.default({ defaultValue: adminPassword.salt }) },
                    { weight: 0.75, value: f.default({ defaultValue: standardPassword.salt }) },
                ]),
            },
        },

        // Seed channels
        channels: {
            count: 8,
            columns: {
                name: f.valuesFromArray({
                    values: [
                        "General",
                        "Development",
                        "Marketing",
                        "Design",
                        "Random",
                        "Project Alpha",
                        "Support",
                        "Chat",
                    ],
                }),
                description: f.weightedRandom([
                    {
                        weight: 0.7,
                        value: f.loremIpsum({ sentencesCount: 3 }),
                    },
                    {
                        weight: 0.3,
                        value: f.valuesFromArray({
                            values: [
                                "Official channel for team discussions",
                                "Project coordination and updates",
                                "Share ideas and inspiration",
                                "Get help with technical issues",
                                "Off-topic conversations",
                            ],
                        }),
                    },
                ]),
                maxParticipants: f.valuesFromArray({
                    values: [10, 20, 30, 50],
                }),
                accessSettings: f.default({
                    defaultValue: {
                        isPrivate: false,
                        requiresInvite: true,
                    },
                }),
            },
        },

        // Seed channel invites
        channelInvites: {
            count: 15,
            columns: {
                inviteCode: f.string({ isUnique: true }),
                email: f.email(),
                expiresAt: f.date({ minDate: new Date("2025-05-01"), maxDate: new Date("2025-12-31") }),
                isUsed: f.boolean(),
            },
        },

        // Seed messages
        messages: {
            count: 100,
            columns: {
                content: f.weightedRandom([
                    {
                        weight: 0.7,
                        value: f.loremIpsum({ sentencesCount: 3 }),
                    },
                    {
                        weight: 0.3,
                        value: f.valuesFromArray({
                            values: [
                                "Hello everyone!",
                                "Has anyone started on the new feature?",
                                "The meeting is scheduled for tomorrow at 10 AM",
                                "I've pushed my changes to the repository",
                                "Can someone help me with this issue?",
                                "Great job on the last release!",
                                "I'll be out of office next week",
                                "Let's discuss this in our next standup",
                                "The documentation needs updating",
                                "Don't forget to update your dependencies",
                            ],
                        }),
                    },
                ]),
                isEdited: f.boolean(),
                isDeleted: f.boolean(),
            },
        },
    }));

    // Post-processing to establish proper channel membership
    console.log("Setting up channel members...");

    // Get all users and channels
    const users = await db.select().from(schema.users);
    const channels = await db.select().from(schema.channels);

    // Create membership records for each channel
    for (const channel of channels) {
        const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

        // The first user will be the owner
        const ownerUser = shuffledUsers[0];

        // The next 2 users will be moderators
        const moderators = shuffledUsers.slice(1, 3);

        // The next 3-7 users will be regular members
        const regularMembers = shuffledUsers.slice(3, 3 + Math.floor(Math.random() * 5) + 3);

        // Create owner record
        await db.insert(schema.channelMembers).values({
            channelId: channel.id,
            userId: ownerUser.id,
            role: "owner",
            permissions: {
                manage_members: true,
                manage_messages: true,
                manage_tasks: true,
                manage_calls: true,
                manage_polls: true,
            },
        });

        // Create moderator records
        for (const moderator of moderators) {
            await db.insert(schema.channelMembers).values({
                channelId: channel.id,
                userId: moderator.id,
                role: "moderator",
                permissions: {
                    manage_members: true,
                    manage_messages: true,
                    manage_tasks: true,
                    manage_calls: true,
                    manage_polls: true,
                },
            });
        }

        // Create regular member records
        for (const member of regularMembers) {
            await db.insert(schema.channelMembers).values({
                channelId: channel.id,
                userId: member.id,
                role: "user",
                permissions: {
                    manage_members: false,
                    manage_messages: false,
                    manage_tasks: false,
                    manage_calls: false,
                    manage_polls: false,
                },
            });
        }
    }

    // Fix channel invites to have valid creator references
    await db.execute(sql`
        UPDATE channel_invites 
        SET created_by_user_id = (SELECT id FROM users ORDER BY RANDOM() LIMIT 1)
        WHERE created_by_user_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM users WHERE id = created_by_user_id
        )
    `);

    // Fix messages to have valid user and channel references
    await db.execute(sql`
        UPDATE messages 
        SET user_id = (SELECT id FROM users ORDER BY RANDOM() LIMIT 1)
        WHERE user_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM users WHERE id = user_id
        )
    `);

    await db.execute(sql`
        UPDATE messages 
        SET channel_id = (SELECT id FROM channels ORDER BY RANDOM() LIMIT 1)
        WHERE channel_id IS NULL OR NOT EXISTS (
            SELECT 1 FROM channels WHERE id = channel_id
        )
    `);

    console.log("Successfully set up channel memberships!");
    console.log("Seed process completed successfully!");
    await pool.end();
}

main().catch((error) => {
    console.error("Error during seeding:", error);
    process.exit(1);
});
