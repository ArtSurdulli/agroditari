import { SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ROW_WIDTHS = ["w-32", "w-24", "w-28"];

// Shown inside a SelectContent while its options are still loading, so an
// empty dropdown doesn't read as broken.
export function SelectLoadingItem() {
  return (
    <>
      {ROW_WIDTHS.map((width, index) => (
        <SelectItem key={index} value={`__loading_${index}__`} disabled>
          <Skeleton className={`h-3.5 ${width}`} />
        </SelectItem>
      ))}
    </>
  );
}
