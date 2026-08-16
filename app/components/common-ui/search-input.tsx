import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { cn } from "~/lib/utils";

export interface SearchInputProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  className,
  value = "",
  onChange,
  placeholder,
}: Readonly<SearchInputProps>) {
  return (
    <InputGroup className={cn(className)}>
      <InputGroupInput
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          className={value.length > 0 ? "" : "opacity-0"}
          onClick={() => onChange?.("")}
          aria-label="Clear search"
        >
          <X />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
