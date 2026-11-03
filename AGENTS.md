<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep public content routes SSR-enabled and account pages under the client-only `_authenticated` layout so browser sessions do not cause refresh redirect loops.
- Use a single root MemberProvider for identity transitions and cache invalidation; authenticated server functions use the generated bearer middleware and user-scoped client.
- Store profile information separately from protected user_roles; signup always creates a member role and administrator assignment is privileged, never derived from metadata.
- Keep roadmap.md as the staged implementation checklist; introduce future destinations only when genuine functionality exists, otherwise label them forthcoming without links.
- Use shared pageHead for new leaf metadata and global semantic tokens for presentation so the brand stays consistent across stages.

- Store publication metadata, restricted sections and original files separately; published metadata is public while drafts and paid contents stay RLS-gated, so paid listings never leak reading assets.
- Save books and sections transactionally through an admin-checked database function; secure uploads use a private bucket and signed access, because drafts must not expose file URLs.
- Keep book reading and artwork device-local with per-book and per-section keys until account-private progress is implemented, so chapters never overwrite each other.
