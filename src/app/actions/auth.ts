"use server";

// POC mode: auth forms navigate on the client. These server actions
// are kept only so any stale import doesn't break the build.

export type AuthState = { error?: string } | undefined;

export async function signupAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return undefined;
}

export async function loginAction(
  _prev: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  return undefined;
}

export async function logout() {
  // no-op in POC mode
}
