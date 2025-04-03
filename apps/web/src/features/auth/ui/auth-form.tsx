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

import classes from "./auth-form.module.css";

  type AuthFormProps = {
      type: "login" | "register";
  };

export function AuthForm({ type }: AuthFormProps) {
    const isLogin = type === "login";

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
                <form>
                    <Stack>
                        {!isLogin && (
                            <>
                                <TextInput
                                    label="Имя"
                                    placeholder="Ваше имя"
                                    required
                                    radius="md"
                                    name="name"
                                />
                                <TextInput
                                    label="Фамилия"
                                    placeholder="Ваша фамилия"
                                    required
                                    radius="md"
                                    name="surname"
                                />
                                <TextInput
                                    label="Имя пользователя"
                                    placeholder="username"
                                    required
                                    radius="md"
                                    name="username"
                                    description="От 3 до 20 символов, только буквы, цифры и подчеркивания"
                                />
                            </>
                        )}
                        <TextInput
                            label="Email"
                            placeholder="example@mail.com"
                            required
                            radius="md"
                            name="email"
                            type="email"
                        />
                        <PasswordInput
                            label="Пароль"
                            placeholder="Ваш пароль"
                            required
                            radius="md"
                            name="password"
                            description={!isLogin ? "Минимум 8 символов" : ""}
                        />
                        {!isLogin && (
                            <PasswordInput
                                label="Подтверждение пароля"
                                placeholder="Повторите пароль"
                                required
                                radius="md"
                                name="passwordConfirmation"
                            />
                        )}
                        {!isLogin && (
                            <Checkbox
                                label="Я согласен с условиями использования"
                                required
                                name="terms"
                            />
                        )}
                        {isLogin && (
                            <Group justify="space-between" mt="md">
                                <Checkbox label="Запомнить меня" name="rememberMe" />
                                <Anchor component="button" size="sm">
                                    Забыли пароль?
                                </Anchor>
                            </Group>
                        )}
                    </Stack>
                    <Button type="submit" radius="xl" fullWidth mt="xl">
                        {isLogin ? "Войти" : "Зарегистрироваться"}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}
