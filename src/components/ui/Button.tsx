import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

// Adapted from the shadcn/ui Button primitive as a native link for section navigation.
const buttonVariants = cva('action', {
  variants: {
    variant: { primary: 'action-primary', secondary: 'action-secondary' },
  },
  defaultVariants: { variant: 'primary' },
})

type ButtonLinkProps = ComponentProps<'a'> &
  VariantProps<typeof buttonVariants> & { href: string }

export function ButtonLink({ className, variant, ...props }: ButtonLinkProps) {
  return <a className={buttonVariants({ variant, className })} {...props} />
}
