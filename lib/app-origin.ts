// The Netlify deployment origin is public build metadata, never a credential.
export function configuredAppOrigin() {
  const value = process.env.APP_ORIGIN || process.env.FOUNDRY_DEPLOY_ORIGIN;
  return value ? new URL(value).origin : null;
}

export function sameOrigin(request: Request) {
  try {
    return (
      request.headers.get("origin") ===
        (configuredAppOrigin() || new URL(request.url).origin) &&
      request.headers.get("sec-fetch-site") !== "cross-site"
    );
  } catch {
    return false;
  }
}
