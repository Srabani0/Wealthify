import { useState } from "react";

export function useRowSelection<T extends string>(ids: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  function toggle(id: T) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, toggle, toggleAll, clear, allSelected, count: selected.size };
}
