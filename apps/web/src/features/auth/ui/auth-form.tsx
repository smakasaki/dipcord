import { typeboxResolver } from "@hookform/resolvers/typebox";
import {
    Alert,
    Anchor,
    Button,
    Checkbox,
    Container,
    Divider,
    Group,
    Loader,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { GoogleButton, MicrosoftButton } from "#/shared/ui/auth-buttons";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { LoginFormType, RegisterFormType } from "../model";

import { loginCheck, registerCheck, useAuthError, useIsAuthenticated, useLoginMutation, useRegisterMutation, validatePasswordConfirmation } from "../model";
import classes from "./auth-form.module.css";

type AuthFormProps = {
    type: "login" | "register";
};

export function AuthForm({ type }: AuthFormProps) {
    const isLogin = type === "login";
    const navigate = useNavigate();
    const { loginMutation, isLoading: isLoginLoading } = useLoginMutation();
    const { registerMutation, isLoading: isRegisterLoading } = useRegisterMutation();
    const isAuthenticated = useIsAuthenticated();
    const authError = useAuthError();

    useEffect(() => {
        if (isAuthenticated) {
            navigate({ to: "/" });
        }
    }, [isAuthenticated, navigate]);

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

    const handleLoginFormSubmit = async (data: LoginFormType) => {
        await loginMutation({
            email: data.email,
            password: data.password,
        });
    };

    const handleRegisterFormSubmit = async (data: RegisterFormType) => {
        if (data.agreement === false) {
            setError("agreement", {
                type: "manual",
                message: "Вы должны согласиться с условиями использования",
            });
            return;
        }

        const errors = validatePasswordConfirmation(data);
        if (Object.keys(errors).length > 0) {
            for (const [key, message] of Object.entries(errors)) {
                setError(key as keyof RegisterFormType, {
                    type: "manual",
                    message,
                });
            }
            return;
        }

        const { passwordConfirm, agreement, ...userData } = data;

        await registerMutation(userData);
    };

    const password = watch("password");

    const isLoading = isLogin ? isLoginLoading : isRegisterLoading;

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
                {authError && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Ошибка"
                        color="red"
                        mb="md"
                    >
                        {authError}
                    </Alert>
                )}

                <Group grow mb="md">
                    <GoogleButton radius="md">Google</GoogleButton>
                    <MicrosoftButton radius="md">Microsoft</MicrosoftButton>
                </Group>

                <Divider label="Или продолжить с помощью email" labelPosition="center" my="lg" />

                {isLogin
                    ? (
                            <form onSubmit={handleLoginSubmit(handleLoginFormSubmit)}>
                                <Stack>
                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...registerLogin("email")}
                                        error={loginErrors.email?.message}
                                        disabled={isLoading}
                                    />

                                    <PasswordInput
                                        label="Пароль"
                                        placeholder="Ваш пароль"
                                        radius="md"
                                        {...registerLogin("password")}
                                        error={loginErrors.password?.message}
                                        disabled={isLoading}
                                    />

                                    <Group justify="space-between" mt="md">
                                        <Checkbox
                                            label="Запомнить меня"
                                            {...registerLogin("rememberMe")}
                                            disabled={isLoading}
                                        />
                                        <Anchor component="button" size="sm">
                                            Забыли пароль?
                                        </Anchor>
                                    </Group>
                                </Stack>

                                <Button
                                    type="submit"
                                    radius="xl"
                                    fullWidth
                                    mt="xl"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader size="sm" /> : "Войти"}
                                </Button>
                            </form>
                        )
                    : (
                            <form onSubmit={handleSignupSubmit(handleRegisterFormSubmit)}>
                                <Stack>
                                    <TextInput
                                        label="Имя"
                                        placeholder="Ваше имя"
                                        radius="md"
                                        {...registerSignup("name")}
                                        error={signupErrors.name?.message}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Фамилия"
                                        placeholder="Ваша фамилия"
                                        radius="md"
                                        {...registerSignup("surname")}
                                        error={signupErrors.surname?.message}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Имя пользователя"
                                        placeholder="username"
                                        radius="md"
                                        {...registerSignup("username")}
                                        error={signupErrors.username?.message}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...registerSignup("email")}
                                        error={signupErrors.email?.message}
                                        disabled={isLoading}
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
                                        disabled={isLoading}
                                    />

                                    <PasswordInput
                                        label="Подтверждение пароля"
                                        placeholder="Повторите пароль"
                                        radius="md"
                                        {...registerSignup("passwordConfirm")}
                                        error={signupErrors.passwordConfirm?.message}
                                        disabled={isLoading}
                                    />

                                    <Checkbox
                                        mt="md"
                                        label="Я принимаю условия использования и политику конфиденциальности"
                                        {...registerSignup("agreement")}
                                        error={signupErrors.agreement?.message}
                                        disabled={isLoading}
                                    />
                                </Stack>

                                <Button
                                    type="submit"
                                    radius="xl"
                                    fullWidth
                                    mt="xl"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader size="sm" /> : "Зарегистрироваться"}
                                </Button>
                            </form>
                        )}
            </Paper>
        </Container>
    );
}
