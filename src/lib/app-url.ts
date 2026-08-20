type AppUrlEnvironment = {
  [key: string]: string | undefined;
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_URL?: string;
};

function withoutTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getAppUrl(environment: AppUrlEnvironment = process.env) {
  const configuredUrl = environment.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return withoutTrailingSlash(configuredUrl);
  }

  const vercelUrl = environment.VERCEL_URL?.trim();

  if (vercelUrl) {
    const absoluteUrl = /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`;
    return withoutTrailingSlash(absoluteUrl);
  }

  return "http://localhost:3000";
}
