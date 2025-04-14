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
import { useForm, zodResolver } from "@mantine/form";
import { IconAlertCircle } from "@tabler/icons-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import type { LoginFormType, RegisterFormType } from "../model";

import { loginSchema, registerSchema, useAuthError, useIsAuthenticated, useLoginMutation, useRegisterMutation } from "../model";
import classes from "./auth-form.module.css";
import { GoogleButton } from "./google-button";
import { MicrosoftButton } from "./microsoft-button";

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

    const loginForm = useForm<LoginFormType>({
        initialValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
        validate: zodResolver(loginSchema),
    });

    const registerForm = useForm<RegisterFormType>({
        initialValues: {
            name: "",
            surname: "",
            username: "",
            email: "",
            password: "",
            passwordConfirm: "",
            agreement: false,
        },
        validate: zodResolver(registerSchema),
    });

    const handleLoginFormSubmit = async (data: LoginFormType) => {
        await loginMutation({
            email: data.email,
            password: data.password,
        });
    };

    const handleRegisterFormSubmit = async (data: RegisterFormType) => {
        const { passwordConfirm, agreement, ...userData } = data;
        await registerMutation(userData);
    };

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
                            <form onSubmit={loginForm.onSubmit(handleLoginFormSubmit)}>
                                <Stack>
                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...loginForm.getInputProps("email")}
                                        disabled={isLoading}
                                    />

                                    <PasswordInput
                                        label="Пароль"
                                        placeholder="Ваш пароль"
                                        radius="md"
                                        {...loginForm.getInputProps("password")}
                                        disabled={isLoading}
                                    />

                                    <Group justify="space-between" mt="md">
                                        <Checkbox
                                            label="Запомнить меня"
                                            {...loginForm.getInputProps("rememberMe", { type: "checkbox" })}
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
                            <form onSubmit={registerForm.onSubmit(handleRegisterFormSubmit)}>
                                <Stack>
                                    <TextInput
                                        label="Имя"
                                        placeholder="Ваше имя"
                                        radius="md"
                                        {...registerForm.getInputProps("name")}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Фамилия"
                                        placeholder="Ваша фамилия"
                                        radius="md"
                                        {...registerForm.getInputProps("surname")}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Имя пользователя"
                                        placeholder="username"
                                        radius="md"
                                        {...registerForm.getInputProps("username")}
                                        disabled={isLoading}
                                    />

                                    <TextInput
                                        label="Email"
                                        placeholder="example@mail.com"
                                        radius="md"
                                        {...registerForm.getInputProps("email")}
                                        disabled={isLoading}
                                    />

                                    <PasswordInput
                                        label="Пароль"
                                        placeholder="Ваш пароль"
                                        radius="md"
                                        {...registerForm.getInputProps("password")}
                                        disabled={isLoading}
                                    />

                                    <PasswordInput
                                        label="Подтверждение пароля"
                                        placeholder="Повторите пароль"
                                        radius="md"
                                        {...registerForm.getInputProps("passwordConfirm")}
                                        disabled={isLoading}
                                    />

                                    <Checkbox
                                        mt="md"
                                        label="Я принимаю условия использования и политику конфиденциальности"
                                        {...registerForm.getInputProps("agreement", { type: "checkbox" })}
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
