export interface BaseOptions {
  /**
   * Current working directory
   */
  cwd: string
  /**
   * Whether the project is a Rush monorepo.
   * When true, the pnpm agent will use `rush-pnpm` instead of `pnpm`.
   * @internal
   */
  rush?: boolean
}
