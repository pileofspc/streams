export type GoogleCredentials = {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
};

export type GoogleToken = {
    access_token?: string | undefined | null;
    refresh_token?: string | undefined | null;
    scope?: string;
    token_type?: string | null | undefined;
    expiry_date?: number | null | undefined;
};

export type SparseArray<T> = (T | undefined)[];
