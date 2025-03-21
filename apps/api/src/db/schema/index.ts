import {
    boolean,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    surname: text("surname").notNull(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    roles: jsonb("roles").notNull().default(["user"]),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    token: varchar("token", { length: 64 }).notNull().unique(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    token: varchar("token", { length: 64 }).notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    usedAt: timestamp("used_at"),
});

export const channels = pgTable("channels", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    maxParticipants: integer("max_participants").notNull().default(50),
    accessSettings: jsonb("access_settings").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const channelMembers = pgTable("channel_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id")
        .notNull()
        .references(() => channels.id),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id),
    role: text("role").notNull().default("user"),
    permissions: jsonb("permissions").notNull().default({
        manage_members: false,
        manage_messages: false,
        manage_tasks: false,
        manage_calls: false,
        manage_polls: false,
    }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, table => [
    uniqueIndex("channel_member_channel_user_idx").on(table.channelId, table.userId),
]);

export const channelInvites = pgTable("channel_invites", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull().references(() => channels.id),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    inviteCode: varchar("invite_code", { length: 64 }).notNull().unique(),
    email: text("email"),
    expiresAt: timestamp("expires_at"),
    isUsed: boolean("is_used").notNull().default(false),
    usedByUserId: uuid("used_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull().references(() => channels.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    parentMessageId: uuid("parent_message_id"),
    content: text("content"),
    isEdited: boolean("is_edited").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
    index("message_channel_created_at_idx").on(table.channelId, table.createdAt),
    index("message_parent_message_idx").on(table.parentMessageId),
    foreignKey({
        columns: [table.parentMessageId],
        foreignColumns: [table.id],
        name: "messages_parent_message_id_fkey",
    }),
]);

export const messageAttachments = pgTable("message_attachments", {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().references(() => messages.id),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    s3Location: text("s3_location").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messageMentions = pgTable("message_mentions", {
    id: uuid("id").primaryKey().defaultRandom(),
    messageId: uuid("message_id").notNull().references(() => messages.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [
    uniqueIndex("message_mention_message_user_idx").on(table.messageId, table.userId),
    index("message_mention_user_created_at_idx").on(table.userId, table.createdAt),
]);

export const tasks = pgTable("tasks", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull().references(() => channels.id),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, table => [
    index("task_channel_status_idx").on(table.channelId, table.status),
    index("task_assigned_status_idx").on(table.assignedToUserId, table.status),
    index("task_channel_assigned_idx").on(table.channelId, table.assignedToUserId),
]);

export const taskCalendarEvents = pgTable("task_calendar_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id),
    calendarEventId: text("calendar_event_id").notNull(),
    calendarType: text("calendar_type").notNull().default("google"),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
}, table => [
    uniqueIndex("task_calendar_task_idx").on(table.taskId),
    uniqueIndex("task_calendar_event_idx").on(table.calendarEventId, table.calendarType),
]);

export const calls = pgTable("calls", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull().references(() => channels.id),
    initiatedByUserId: uuid("initiated_by_user_id").notNull().references(() => users.id),
    title: text("title"),
    roomName: text("room_name").notNull().unique(),
    roomUrl: text("room_url").notNull(),
    configuration: jsonb("configuration").notNull().default({ enable_recording: false }),
    startTime: timestamp("start_time").notNull().defaultNow(),
    endTime: timestamp("end_time"),
    status: text("status").notNull().default("active"),
}, table => [
    index("call_channel_status_idx").on(table.channelId, table.status),
    uniqueIndex("call_room_name_idx").on(table.roomName),
]);

export const callParticipants = pgTable("call_participants", {
    id: uuid("id").primaryKey().defaultRandom(),
    callId: uuid("call_id").notNull().references(() => calls.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    leftAt: timestamp("left_at"),
    participantId: text("participant_id").notNull(),
}, table => [
    index("call_participant_call_user_idx").on(table.callId, table.userId),
    uniqueIndex("call_participant_id_idx").on(table.participantId, table.callId),
]);

export const callRecordings = pgTable("call_recordings", {
    id: uuid("id").primaryKey().defaultRandom(),
    callId: uuid("call_id").notNull().references(() => calls.id),
    startedByUserId: uuid("started_by_user_id").notNull().references(() => users.id),
    recordingId: text("recording_id").notNull(),
    s3Location: text("s3_location"),
    status: text("status").notNull().default("in_progress"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
}, table => [
    index("call_recording_call_idx").on(table.callId),
    uniqueIndex("recording_id_idx").on(table.recordingId),
]);

export const callDocuments = pgTable("call_documents", {
    id: uuid("id").primaryKey().defaultRandom(),
    callId: uuid("call_id").notNull().references(() => calls.id),
    sharedByUserId: uuid("shared_by_user_id").notNull().references(() => users.id),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    s3Location: text("s3_location").notNull(),
    sharedAt: timestamp("shared_at").notNull().defaultNow(),
}, table => [
    index("call_document_call_shared_idx").on(table.callId, table.sharedAt),
]);

export const polls = pgTable("polls", {
    id: uuid("id").primaryKey().defaultRandom(),
    channelId: uuid("channel_id").notNull().references(() => channels.id),
    createdByUserId: uuid("created_by_user_id").notNull().references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    expiresAt: timestamp("expires_at"),
    isClosed: boolean("is_closed").notNull().default(false),
    closedManually: boolean("closed_manually").notNull().default(false),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, table => [
    index("poll_channel_created_at_idx").on(table.channelId, table.createdAt),
    index("poll_channel_is_closed_idx").on(table.channelId, table.isClosed),
]);

export const pollOptions = pgTable("poll_options", {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id").notNull().references(() => polls.id),
    text: text("text").notNull(),
    orderIndex: integer("order_index").notNull(),
}, table => [
    index("poll_option_poll_order_idx").on(table.pollId, table.orderIndex),
]);

export const pollVotes = pgTable("poll_votes", {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id").notNull().references(() => polls.id),
    pollOptionId: uuid("poll_option_id").notNull().references(() => pollOptions.id),
    userId: uuid("user_id").notNull().references(() => users.id),
    votedAt: timestamp("voted_at").notNull().defaultNow(),
}, table => [
    uniqueIndex("poll_vote_poll_user_idx").on(table.pollId, table.userId),
    index("poll_vote_option_idx").on(table.pollOptionId),
]);

// Export types for the users table
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Export types for the sessions table
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Export types for the password reset tokens table
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Export types for the channels table
export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;

// Export types for the channel members table
export type ChannelMember = typeof channelMembers.$inferSelect;
export type NewChannelMember = typeof channelMembers.$inferInsert;

// Export types for the channel invites table
export type ChannelInvite = typeof channelInvites.$inferSelect;
export type NewChannelInvite = typeof channelInvites.$inferInsert;

// Export types for the messages table
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// Export types for the message attachments table
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;

// Export types for the message mentions table
export type MessageMention = typeof messageMentions.$inferSelect;
export type NewMessageMention = typeof messageMentions.$inferInsert;

// Export types for the tasks table
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Export types for the task calendar events table
export type TaskCalendarEvent = typeof taskCalendarEvents.$inferSelect;
export type NewTaskCalendarEvent = typeof taskCalendarEvents.$inferInsert;

// Export types for the calls table
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;

// Export types for the call participants table
export type CallParticipant = typeof callParticipants.$inferSelect;
export type NewCallParticipant = typeof callParticipants.$inferInsert;

// Export types for the call recordings table
export type CallRecording = typeof callRecordings.$inferSelect;
export type NewCallRecording = typeof callRecordings.$inferInsert;

// Export types for the call documents table
export type CallDocument = typeof callDocuments.$inferSelect;
export type NewCallDocument = typeof callDocuments.$inferInsert;

// Export types for the polls table
export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;

// Export types for the poll options table
export type PollOption = typeof pollOptions.$inferSelect;
export type NewPollOption = typeof pollOptions.$inferInsert;

// Export types for the poll votes table
export type PollVote = typeof pollVotes.$inferSelect;
export type NewPollVote = typeof pollVotes.$inferInsert;
