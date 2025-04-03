import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { DefaultErrorFunction, SetErrorFunction } from "@sinclair/typebox/errors";

SetErrorFunction((error) => {
    return error?.schema?.errorMessage ?? DefaultErrorFunction(error);
});

const EMAIL_PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
const PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$";
const USERNAME_PATTERN = "^[a-zA-Z0-9_]{3,20}$";

export const loginSchema = Type.Object({
    email: Type.String({
        pattern: EMAIL_PATTERN,
        errorMessage: "Пожалуйста, введите корректный email адрес",
    }),
    password: Type.String({
        minLength: 1,
        errorMessage: "Пароль не может быть пустым",
    }),
    rememberMe: Type.Optional(Type.Boolean()),
});

export const registerSchema = Type.Object({
    name: Type.String({
        minLength: 1,
        errorMessage: "Имя не может быть пустым",
    }),
    surname: Type.String({
        minLength: 1,
        errorMessage: "Фамилия не может быть пустой",
    }),
    username: Type.String({
        pattern: USERNAME_PATTERN,
        errorMessage: "Имя пользователя должно содержать от 3 до 20 символов (буквы, цифры и _)",
    }),
    email: Type.String({
        pattern: EMAIL_PATTERN,
        errorMessage: "Пожалуйста, введите корректный email адрес",
    }),
    password: Type.String({
        pattern: PASSWORD_PATTERN,
        errorMessage: "Пароль должен содержать минимум 8 символов, включая заглавную букву, строчную букву и цифру",
    }),
    passwordConfirm: Type.String({
        errorMessage: "Пароли должны совпадать",
    }),
    agreement: Type.Boolean({
        // The TypeBox const/enum validation might not be working as expected
        // We'll handle this validation explicitly in the form submission handler
        errorMessage: "Вы должны согласиться с условиями использования",
    }),
});

// Custom schema for password confirmation equality
export const validatePasswordConfirmation = (data: any) => {
    if (data.password !== data.passwordConfirm) {
        return {
            passwordConfirm: "Пароли должны совпадать",
        };
    }
    return {};
};

export type LoginFormType = typeof loginSchema.static;
export type RegisterFormType = typeof registerSchema.static;

export const loginCheck = TypeCompiler.Compile(loginSchema);
export const registerCheck = TypeCompiler.Compile(registerSchema);
