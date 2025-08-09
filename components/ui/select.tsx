import React from "react";
export function Select({ value, onValueChange, children }: any) {
  return <div data-value={value}>{children({ value, onValueChange })}</div>;
}
export function SelectTrigger({ children }: any) { return <div>{children}</div>; }
export function SelectValue(props: any) { return <span>{props.placeholder || ""}</span>; }
export function SelectContent({ children }: any) { return <div>{children}</div>; }
export function SelectItem({ value, children, onSelect }: any) {
  return <button onClick={()=>onSelect?.(value)}>{children}</button>;
}
