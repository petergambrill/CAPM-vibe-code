export function Label({ children, className }: any) {
  return <label className={`text-sm font-medium ${className || ""}`}>{children}</label>;
}
