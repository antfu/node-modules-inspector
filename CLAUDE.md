# Node Modules Inspector - Claude Context

## Intent

### Current Goals
Migrate the Node Modules Inspector to use `devframe` as the underlying framework, maintaining complete backward compatibility with the existing user-facing experience (CLI commands, outputs, configuration, and web interface). Improve author/maintainer detection with inference from repository URLs and support two display modes: GitHub handles and plain text.

### Constraints
- User-facing experience must remain unchanged
- All existing CLI commands must continue to work identically
- Configuration format and options must be preserved
- Output format and behavior must be identical
- One RPC function per file structure (architectural constraint)
- Author detection must gracefully handle both GitHub and non-GitHub sources

### Key Decisions
- [2026-05-01] Migrate to `devframe` - Switching from current framework to devframe to improve development experience and maintainability while preserving all external interfaces and user behavior.
- [2026-05-01] One RPC function per file organization - Establish a clear separation of concerns where each RPC function is defined in its own file for better modularity and maintainability.
- [2026-05-11] Replace `lint-staged` with `nano-staged` - Switching from lint-staged to nano-staged for better performance and simpler configuration in pre-commit hooks.
- [2026-05-16] Introduce dual author detection modes - Implement intelligent author/maintainer detection that infers from repository URLs when available, supporting GitHub handles for beautiful rendering alongside fallback to plain text for non-GitHub sources.
- [2026-05-19] Server-side data unification - Perform data unification on the server side rather than client side to centralize logic and improve data consistency across consumers.

### Open Questions
- Which parts of the codebase need to be refactored vs. kept as-is?
- Are there any performance implications of using devframe?
- How should we handle edge cases where repository URL parsing fails or is ambiguous?

### Implementation Notes
- CLI implementation should leverage devframe patterns from vitejs/devtools PR #304 for consistency and best practices.
