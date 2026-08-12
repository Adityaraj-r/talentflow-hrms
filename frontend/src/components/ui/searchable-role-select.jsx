import { useState, useMemo, useEffect, useRef } from "react";
import { cn, formatChildren } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, Check } from "lucide-react";

export function SearchableRoleSelect({ value, onChange, options, placeholder = "Select Role", className }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleClose = () => setOpen(false);

    const handleScroll = (e) => {
      // Don't close if scrolling inside the dropdown's list
      if (scrollRef.current && scrollRef.current.contains(e.target)) return;
      setOpen(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") setOpen(false);
    };

    // useCapture = true to catch all scroll events in the document
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleClose);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleClose);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(lower));
  }, [options, search]);

  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between font-normal", className)}
        >
          <span className="truncate">{formatChildren(selectedLabel)}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" sideOffset={8} avoidCollisions={false} className="w-[200px] p-0 border-border bg-popover shadow-md" align="start">
        <div className="flex items-center border-b border-border px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
             className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus:outline-none border-0 shadow-none px-0" 
             placeholder="Search roles..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div ref={scrollRef} className="max-h-[240px] overflow-y-auto custom-scrollbar p-1.5">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No roles found.
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 mb-0.5 text-sm font-medium outline-none transition-colors hover:bg-primary/10 hover:text-primary",
                  value === opt.value ? "bg-blue-600/15 dark:bg-blue-500/20 text-primary" : "text-muted-foreground"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    value === opt.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="truncate">{formatChildren(opt.label)}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
