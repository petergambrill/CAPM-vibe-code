export function Card({ className, children }: any) {
  return <div className={`rounded-2xl border ${className || ""}`}>{children}</div>;
}
export function CardContent({ className, children }: any) {
  return <div className={`p-6 ${className || ""}`}>{children}</div>;
}
