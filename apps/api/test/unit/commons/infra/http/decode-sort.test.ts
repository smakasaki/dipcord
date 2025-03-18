/**
 * Unit tests for sort decoding utilities
 */
import { describe, expect, it } from "vitest";

import { decodeSort, validateSortFields } from "#commons/infra/http/utils/decode-sort.js";

describe("decodeSortUtils", () => {
    type TestModel = {
        id: string;
        name: string;
        email: string;
        createdAt: Date;
    };

    describe("decodeSort", () => {
        it("should decode sort strings into SortBy format", () => {
            // Arrange
            const sortStrings = ["name.asc", "createdAt.desc", "id"];

            // Act
            const result = decodeSort<TestModel>(sortStrings);

            // Assert
            expect(result).toEqual([
                ["name", "asc"],
                ["createdAt", "desc"],
                ["id", "asc"], // Default direction
            ]);
        });

        it("should use 'asc' as default direction when not specified", () => {
            // Arrange
            const sortStrings = ["name", "email"];

            // Act
            const result = decodeSort<TestModel>(sortStrings);

            // Assert
            expect(result).toEqual([
                ["name", "asc"],
                ["email", "asc"],
            ]);
        });

        it("should handle empty array", () => {
            // Arrange
            const sortStrings: string[] = [];

            // Act
            const result = decodeSort<TestModel>(sortStrings);

            // Assert
            expect(result).toEqual([]);
        });

        it("should handle invalid formats but might produce unexpected results", () => {
            // Arrange
            const sortStrings = ["name.invalid", "email."];

            // Act
            const result = decodeSort<TestModel>(sortStrings);

            // Assert - this tests the actual behavior, not necessarily desired behavior
            expect(result).toEqual([
                ["name", "invalid"],
                ["email", "asc"], // Empty string after dot, defaults to "asc"
            ]);
        });
    });

    describe("validateSortFields", () => {
        it("should filter out invalid sort fields", () => {
            // Arrange
            const sortStrings = ["name.asc", "invalid.desc", "email"];
            const validKeys: Array<keyof TestModel & string> = ["id", "name", "email", "createdAt"];

            // Act
            const result = validateSortFields<TestModel>(sortStrings, validKeys);

            // Assert
            expect(result).toEqual(["name.asc", "email"]);
        });

        it("should return default sort when all fields are invalid", () => {
            // Arrange
            const sortStrings = ["invalid1.asc", "invalid2.desc"];
            const validKeys: Array<keyof TestModel & string> = ["id", "name", "email", "createdAt"];
            const defaultSort = ["id.asc"];

            // Act
            const result = validateSortFields<TestModel>(sortStrings, validKeys, defaultSort);

            // Assert
            expect(result).toEqual(defaultSort);
        });

        it("should use provided default sort when needed", () => {
            // Arrange
            const sortStrings: string[] = [];
            const validKeys: Array<keyof TestModel & string> = ["id", "name", "email", "createdAt"];
            const defaultSort = ["createdAt.desc"];

            // Act
            const result = validateSortFields<TestModel>(sortStrings, validKeys, defaultSort);

            // Assert
            expect(result).toEqual(defaultSort);
        });

        it("should fall back to id.asc when no default provided and all fields invalid", () => {
            // Arrange
            const sortStrings = ["invalid.asc"];
            const validKeys: Array<keyof TestModel & string> = ["id", "name", "email", "createdAt"];

            // Act
            const result = validateSortFields<TestModel>(sortStrings, validKeys);

            // Assert
            expect(result).toEqual(["id.asc"]);
        });

        it("should validate correctly with field names that include dots", () => {
            // Arrange - "aaa.bbb.ccc" should be treated as field "aaa" with direction "bbb.ccc"
            // This tests defensive programming against unusual inputs
            const sortStrings = ["name.with.dots.asc"];
            const validKeys: Array<string> = ["name", "id"];

            // Act
            const result = validateSortFields(sortStrings, validKeys);

            // Assert - only "name" is evaluated for validity
            expect(result).toEqual([]);
        });
    });
});
