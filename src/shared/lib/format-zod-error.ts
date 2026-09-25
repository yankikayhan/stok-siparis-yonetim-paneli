import { z } from 'zod'

// ZodError issue'larini "path: mesaj" satirlarina cevirir; gelistirici logu icindir.
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) =>
      issue.path.length === 0 ? issue.message : `${issue.path.map(String).join('.')}: ${issue.message}`,
    )
    .join('\n')
}
