# Node Modules Inspector - Claude Context

## Intent

### Current Goals
Migrate the Node Modules Inspector to use `devframe` as the underlying framework, maintaining complete backward compatibility with the existing user-facing experience (CLI commands, outputs, configuration, and web interface).

### Constraints
- User-facing experience must remain unchanged
- All existing CLI commands must continue to work identically
- Configuration format and options must be preserved
- Output format and behavior must be identical
- One RPC function per file structure (architectural constraint)

### Key Decisions
- [2026-05-01] Migrate to `devframe` - Switching from current framework to devframe to improve development experience and maintainability while preserving all external interfaces and user behavior.
- [2026-05-01] One RPC function per file organization - Establish a clear separation of concerns where each RPC function is defined in its own file for better modularity and maintainability.

### Open Questions
- Which parts of the codebase need to be refactored vs. kept as-is?
- Are there any performance implications of using devframe?

### Implementation Notes
- CLI implementation should leverage devframe patterns from vitejs/devtools PR #304 for consistency and best practices.
