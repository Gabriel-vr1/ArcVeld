import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

// Adapted from the shadcn/ui Badge primitive. See THIRD_PARTY_NOTICES.md.
const badgeVariants = cva('badge', {
  variants: {
    tone: {
      neutral: 'badge-neutral',
      green: 'badge-green',
      rain: 'badge-rain',
      ochre: 'badge-ochre',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={badgeVariants({ tone, className })} {...props} />
}
