import { TSchema, Type } from '@sinclair/typebox';

export const Pagination = Type.Object({
  offset: Type.Optional(Type.Number({ default: 0 })),
  limit: Type.Optional(Type.Number({ default: 10 })),
});

export const PaginationResult = <T extends TSchema>(itemSchema: T) =>
  Type.Object({
    count: Type.Number({ default: 0 }),
    data: Type.Array(itemSchema),
  });

export const NoContent = Type.Object({});

export const UUID = Type.String({
  format: 'uuid',
  description: 'UUID identifier',
});

export const ID = Type.Object({
  id: UUID,
});

export const ErrorResponse = Type.Object({
  statusCode: Type.Number(),
  error: Type.String(),
  message: Type.String(),
});