import { typeboxResolver } from "@hookform/resolvers/typebox";
import {
    Anchor,
    Button,
    Checkbox,
    Container,
    Divider,
    Group,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { GoogleButton, MicrosoftButton } from "#/shared/ui/auth-buttons";
import { useForm } from "react-hook-form";

import type { LoginFormType, RegisterFormType } from "../model";

import { loginCheck, registerCheck, validatePasswordConfirmation } from "../model";
import classes from "./auth-form.module.css";

type AuthFormProps = {
    type: "login" | "register";
    onSubmit?: (data: LoginFormType | RegisterFormType) => void;
};

export function AuthForm({ type, onSubmit }: AuthFormProps) {
    const isLogin = type === "login";

    // Login form setup - conditionally used when isLogin is true
    const {
        register: registerLogin,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors },
    } = useForm<LoginFormType>({
        resolver: typeboxResolver(loginCheck),
        defaultValues: {
            rememberMe: false,
        },
    });

    // Registration form setup - conditionally used when isLogin is false
    const {
        register: registerSignup,
        handleSubmit: handleSignupSubmit,
        formState: { errors: signupErrors },
        watch,
        setError,
        trigger,
    } = useForm<RegisterFormType>({
        resolver: typeboxResolver(registerCheck),
        defaultValues: {
            agreement: false,
        },
    });

    // Handle form submission - use the appropriate handler based on form type
    const submitHandler = (data: LoginFormType | RegisterFormType) => {
        if (!isLogin) {
            // Explicitly check if agreement is false and prevent form submission
            if ((data as RegisterFormType).agreement === false) {
                setError("agreement", {
                    type: "manual",
                    message: "Вы должны согласиться с условиями использования",
                });
                return; // Stop form submission
            }

            // Custom validation for password confirmation
            const errors = validatePasswordConfirmation(data);
            if (Object.keys(errors).length > 0) {
                for (const [key, message] of Object.entries(errors)) {
                    setError(key as keyof RegisterFormType, {
                        type: "manual",
                        message,
                    });
                }
                return; // Stop form submission if there are errors
            }
        }

        if (onSubmit) {
            onSubmit(data);
        }
        else {
            console.warn("Form submitted:", data);
        }
    };

    // For checking password confirmation match
    const password = watch("password");

    return (
        <Container size={420} my={40}>
            <Title ta="center" className={classes.title}>
                {isLogin ? "Добро пожаловать!" : "Создать аккаунт"}
            </Title>

            <Text c="dimmed" size="sm" ta="center" mt={5}>
                {isLogin ? "Еще нет аккаунта? " : "Уже есть аккаунт? "}
                <Anchor component={Link} to={isLogin ? "/register" : "/login"} size="sm">
                    {isLogin ? "Создать аккаунт" : "Войти"}
                </Anchor>
            </Text>

            <Paper withBorder shadow="md" p={30} mt={30} radius="md">
                <Group grow mb="md">
                    <GoogleButton radius="md">Google</GoogleButton>
                    <MicrosoftButton radius="md">Microsoft</MicrosoftButton>
                </Group>

                <Divider label="Или продолжить с помощью email" labelPosition="center" my="lg" />

                {isLogin
                    ? (
                            <form onSubmit={handleLoginSubmit(submitHandler as (data: LoginFormType) => void)}>
                                <Stack>
                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...registerLogin("email")}
                                        error={loginErrors.email?.message}
                                    />

                                    <PasswordInput
                                        label="Пароль"
                                        placeholder="Ваш пароль"
                                        radius="md"
                                        {...registerLogin("password")}
                                        error={loginErrors.password?.message}
                                    />

                                    <Group justify="space-between" mt="md">
                                        <Checkbox
                                            label="Запомнить меня"
                                            {...registerLogin("rememberMe")}
                                        />
                                        <Anchor component="button" size="sm">
                                            Забыли пароль?
                                        </Anchor>
                                    </Group>
                                </Stack>

                                <Button type="submit" radius="xl" fullWidth mt="xl">
                                    Войти
                                </Button>
                            </form>
                        )
                    : (
                            <form onSubmit={handleSignupSubmit(submitHandler as (data: RegisterFormType) => void)}>
                                <Stack>
                                    <TextInput
                                        label="Имя"
                                        placeholder="Ваше имя"
                                        radius="md"
                                        {...registerSignup("name")}
                                        error={signupErrors.name?.message}
                                    />

                                    <TextInput
                                        label="Фамилия"
                                        placeholder="Ваша фамилия"
                                        radius="md"
                                        {...registerSignup("surname")}
                                        error={signupErrors.surname?.message}
                                    />

                                    <TextInput
                                        label="Имя пользователя"
                                        placeholder="username"
                                        radius="md"
                                        {...registerSignup("username")}
                                        error={signupErrors.username?.message}
                                    />

                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...registerSignup("email")}
                                        error={signupErrors.email?.message}
                                    />

                                    <PasswordInput
                                        label="Пароль"
                                        placeholder="Ваш пароль"
                                        radius="md"
                                        {...registerSignup("password")}
                                        error={signupErrors.password?.message}
                                        onChange={() => {
                                            if (password)
                                                trigger("passwordConfirm");
                                        }}
                                    />

                                    <PasswordInput
                                        label="Подтверждение пароля"
                                        placeholder="Повторите пароль"
                                        radius="md"
                                        {...registerSignup("passwordConfirm")}
                                        error={signupErrors.passwordConfirm?.message}
                                    />

                                    <Checkbox
                                        label={(
                                            <>
                                                Я согласен с
                                                {" "}
                                                <Anchor component={Link} to="/terms" size="sm">условиями использования</Anchor>
                                            </>
                                        )}
                                        {...registerSignup("agreement")}
                                        error={signupErrors.agreement?.message}
                                        onChange={(event) => {
                                            // Clear error when checked
                                            if (event.currentTarget.checked) {
                                                setError("agreement", { message: "" });
                                            }
                                            else {
                                                setError("agreement", {
                                                    message: "Для продолжения регистрации необходимо принять условия использования",
                                                });
                                            }
                                        }}
                                    />
                                </Stack>

                                <Button type="submit" radius="xl" fullWidth mt="xl">
                                    Зарегистрироваться
                                </Button>
                            </form>
                        )}
            </Paper>
        </Container>
    );
}
