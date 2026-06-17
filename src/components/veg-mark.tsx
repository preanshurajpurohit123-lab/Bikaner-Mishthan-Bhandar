export function VegMark({ veg = true }: { veg?: boolean }) {
  const color = veg ? "border-green-700 bg-green-700" : "border-red-700 bg-red-700";
  return (
    <span aria-label={veg ? "Veg" : "Non-veg"} className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${color.split(" ")[0]} bg-white`}>
      <span className={`block h-1.5 w-1.5 rounded-full ${color.split(" ")[1]}`} />
    </span>
  );
}
