# Node Modules Inspector - Claude Context

## Intent

### Current Goals
Migrate the Node Modules Inspector to use `devframe` as the underlying framework, maintaining complete backward compatibility with the existing user-facing experience (CLI commands, outputs, configuration, and web interface). Add a new dependency upgrade tracker view to help identify and manage out-of-range dependencies, with UI focused on upgrade decisions and version alignment in a table format. Improve author/maintainer detection with inference from repository URLs and support two display modes: GitHub handles and plain text.

### Constraints
- User-facing experience must remain unchanged for existing features
- All existing CLI commands must continue to work identically
- Configuration format and options must be preserved
- Output format and behavior must be identical
- One RPC function per file structure (architectural constraint)
- Details page UI should prioritize dependency upgrade information over package-centric view
- Author detection must gracefully handle both GitHub and non-GitHub sources
- Dependency update actions must ignore dependencies that share the same repository link (e.g., monorepo packages like nuxt and @nuxt/kit)

### Key Decisions
- [2026-05-01] Migrate to `devframe` - Switching from current framework to devframe to improve development experience and maintainability while preserving all external interfaces and user behavior.
- [2026-05-01] One RPC function per file organization - Establish a clear separation of concerns where each RPC function is defined in its own file for better modularity and maintainability.
- [2026-05-11] Replace `lint-staged` with `nano-staged` - Switching from lint-staged to nano-staged for better performance and simpler configuration in pre-commit hooks.
- [2026-05-12] Add package maintainer actions view - New feature to track out-of-range dependencies and peerDependencies across the workspace, showing which packages lag behind available versions and providing template communications for maintainers.
- [2026-05-16] Introduce dual author detection modes - Implement intelligent author/maintainer detection that infers from repository URLs when available, supporting GitHub handles for beautiful rendering alongside fallback to plain text for non-GitHub sources.
- [2026-05-19] Server-side data unification - Perform data unification on the server side rather than client side to centralize logic and improve data consistency across consumers.
- [2026-05-19] Enhance maintainer actions view with catalog resolution and filtering - Resolve catalogs for workspace packages (e.g., "catalog:deps -> v0.2.16"), group results by package, and add filtering capability by package maintainers to improve actionability and organization of the view.
- [2026-05-21] Refactor dependency upgrade view UI - Replace side panel with right-drawer layout, display version changes in table format for better alignment, remove "Message to Maintainer" feature, and refocus details page on dependency upgrade decisions rather than package-centric view.
- [2026-05-21] Ignore monorepo dependencies in deps update actions - Exclude dependencies that share the same repository link from dependency update actions (e.g., nuxt and @nuxt/kit from the same monorepo) to avoid redundant or confusing update suggestions.

### Open Questions
- Which parts of the codebase need to be refactored vs. kept as-is?
- Are there any performance implications of using devframe?
- Should this view track both deps and peerDeps with the same priority, or should there be distinction?
- How should we handle edge cases where repository URL parsing fails or is ambiguous?

### Implementation Notes
- CLI implementation should leverage devframe patterns from vitejs/devtools PR #304 for consistency and best practices.
