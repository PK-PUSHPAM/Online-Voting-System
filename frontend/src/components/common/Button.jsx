import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        "btn",
        `btn--${variant}`,
        `btn--${size}`,
        isDisabled && "btn--disabled",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <LoaderCircle className="spin" size={18} /> : children}
    </button>
  );
}
