# Security policy

z-stash handles private captures and user-provided API credentials. Please do not report vulnerabilities through a public GitHub issue.

Report security concerns privately to the repository owner through the contact details at [zitti.ro](https://zitti.ro).

Supported security expectations:

- Production access fails closed unless `APP_ALLOWED_EMAILS` is configured.
- Supabase Row Level Security isolates user data.
- API routes accept cookie sessions or Supabase bearer tokens from allowlisted users.
- Secrets belong in deployment environment variables or protected user settings, never in the repository.
- Dependency advisories are reviewed before each release.
