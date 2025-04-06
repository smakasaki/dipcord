import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "./types/api";

const fetchClient = createFetchClient<paths>({
    baseUrl: "/api",
    credentials: "include"
});

export const $api = createClient(fetchClient);

export const { GET, POST, PUT, DELETE, PATCH } = fetchClient;
