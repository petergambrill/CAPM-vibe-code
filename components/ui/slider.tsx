export function Slider({ value, onValueChange }: any) {
  const v = value?.[0] ?? 0;
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={v}
      onChange={(e)=> onValueChange?.([Number(e.target.value)])}
    />
  );
}
