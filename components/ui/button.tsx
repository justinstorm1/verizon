import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const baseButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-brand-red text-white hover:bg-brand-red-dark",
        dark: "bg-ink text-white hover:bg-[#262626]",
        outline: "border-ink bg-white text-ink hover:bg-ink hover:text-white",
        ghost: "text-ink hover:bg-gray-light",
        link: "rounded-none px-0 text-ink underline underline-offset-4 hover:text-brand-red",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/** cva output merged with cn, so variant classes win over base classes on links too */
function buttonVariants({
  className,
  ...variants
}: VariantProps<typeof baseButtonVariants> & { className?: string } = {}) {
  return cn(baseButtonVariants(variants), className)
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Omit<ButtonPrimitive.Props, "className"> &
  VariantProps<typeof baseButtonVariants> & { className?: string }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
