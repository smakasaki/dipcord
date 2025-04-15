import { z } from "zod";

export const loginSchema = z.object({
    email: z.string()
        .min(1, "Пожалуйста, введите email")
        .email("Пожалуйста, введите корректный email адрес"),
    password: z.string()
        .min(1, "Пароль не может быть пустым"),
    rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
    name: z.string()
        .min(1, "Имя не может быть пустым"),
    surname: z.string()
        .min(1, "Фамилия не может быть пустой"),
    username: z.string()
        .min(3, "Имя пользователя должно содержать минимум 3 символа")
        .max(20, "Имя пользователя должно содержать максимум 20 символов")
        .refine(val => /^\w+$/.test(val), "Имя пользователя может содержать только буквы, цифры и _"),
    email: z.string()
        .min(1, "Пожалуйста, введите email")
        .email("Пожалуйста, введите корректный email адрес"),
    password: z.string()
        .min(8, "Пароль должен содержать минимум 8 символов")
        .refine(
            val => /[A-Z]/.test(val),
            "Пароль должен содержать хотя бы одну заглавную букву",
        )
        .refine(
            val => /[a-z]/.test(val),
            "Пароль должен содержать хотя бы одну строчную букву",
        )
        .refine(
            val => /\d/.test(val),
            "Пароль должен содержать хотя бы одну цифру",
        ),
    passwordConfirm: z.string(),
    agreement: z.boolean(),
}).refine(data => data.password === data.passwordConfirm, {
    message: "Пароли должны совпадать",
    path: ["passwordConfirm"],
}).refine(data => data.agreement === true, {
    message: "Вы должны согласиться с условиями использования",
    path: ["agreement"],
});

export type LoginFormType = z.infer<typeof loginSchema>;
export type RegisterFormType = z.infer<typeof registerSchema>;
