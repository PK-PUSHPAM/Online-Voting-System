import { cn } from "../../lib/utils";

export default function InputField({
  label,
  error,
  hint,
  className = "",
  ...props
}) {
  return (
    <div className={cn("form-field", className)}>
      {label ? <label className="form-label">{label}</label> : null}

      <input
        className={cn("form-input", error && "form-input--error")}
        {...props}
      />

      {error ? <p className="form-error">{error}</p> : null}
      {!error && hint ? <p className="form-hint">{hint}</p> : null}
    </div>
  );
}
