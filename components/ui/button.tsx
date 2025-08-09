export function Button({ className, variant, ...props }: any) {
  const base = "px-3 py-2 rounded-2xl border shadow-sm";
  const styles = variant === "secondary" ? "bg-gray-100" : "bg-black text-white";
  return <button className={`${base} ${styles} ${className || ""}`} {...props} />;
}
