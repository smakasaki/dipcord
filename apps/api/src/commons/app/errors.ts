import createError from "@fastify/error";

// Base application errors
export const ApplicationError = createError("FST_APPLICATION_ERROR", "%s", 500);
export const NotFoundError = createError("FST_NOT_FOUND", "%s", 404);
export const UnauthorizedError = createError("FST_UNAUTHORIZED", "%s", 401);
export const BadRequestError = createError("FST_BAD_REQUEST", "%s", 400);
export const ConflictError = createError("FST_CONFLICT", "%s", 409);
export const ValidationError = createError("FST_VALIDATION_ERROR", "%s", 400);

// Database errors
export const DatabaseError = createError("FST_DB_ERROR", "%s", 500);
export const ConnectionError = createError("FST_DB_CONNECTION_ERROR", "%s", 500);

// Authentication errors
export const AuthenticationError = createError("FST_AUTH_ERROR", "%s", 401);
export const TokenError = createError("FST_TOKEN_ERROR", "%s", 401);
export const SessionError = createError("FST_SESSION_ERROR", "%s", 401);
export const PasswordResetError = createError("FST_PASSWORD_RESET_ERROR", "%s", 400);

// User errors
export const UserError = createError("FST_USER_ERROR", "%s", 400);
export const UserNotFoundError = createError("FST_USER_NOT_FOUND", "User with id %s not found", 404);
export const UserEmailExistsError = createError("FST_USER_EMAIL_EXISTS", "User with email %s already exists", 409);
export const UserUsernameExistsError = createError("FST_USER_USERNAME_EXISTS", "User with username %s already exists", 409);

// Authorization errors
export const ForbiddenError = createError("FST_FORBIDDEN", "%s", 403);
export const PermissionDeniedError = createError("FST_PERMISSION_DENIED", "%s", 403);

// Channel errors
export const ChannelError = createError("FST_CHANNEL_ERROR", "%s", 400);
export const ChannelNotFoundError = createError("FST_CHANNEL_NOT_FOUND", "Channel with id %s not found", 404);

// Message errors
export const MessageError = createError("FST_MESSAGE_ERROR", "%s", 400);
export const MessageNotFoundError = createError("FST_MESSAGE_NOT_FOUND", "Message with id %s not found", 404);

// Task errors
export const TaskError = createError("FST_TASK_ERROR", "%s", 400);
export const TaskNotFoundError = createError("FST_TASK_NOT_FOUND", "Task with id %s not found", 404);

// Poll errors
export const PollError = createError("FST_POLL_ERROR", "%s", 400);
export const PollNotFoundError = createError("FST_POLL_NOT_FOUND", "Poll with id %s not found", 404);

// Call errors
export const CallError = createError("FST_CALL_ERROR", "%s", 400);
export const CallNotFoundError = createError("FST_CALL_NOT_FOUND", "Call with id %s not found", 404);
