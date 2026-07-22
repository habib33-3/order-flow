const withPrefix = (...parts: string[]) => `app-cache:${parts.join(":")}`;

export const userCacheKeyWithEmail = (email: string) =>
    withPrefix("user", "email", email);

export const userCacheKeyWithId = (id: string) => withPrefix("user", "id", id);
