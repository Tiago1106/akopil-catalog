"use client";

import ptBR from "@/locales/pt-BR.json";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";

export function OptionMultiselect({
  id,
  value,
  onChange,
  items,
  placeholder,
}: {
  id: string;
  value: string[];
  onChange: (value: string[]) => void;
  items: string[];
  placeholder: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{ptBR.admin.products.form.optionsEmpty}</p>;
  }

  return (
    <Combobox items={items} multiple value={value} onValueChange={onChange}>
      <ComboboxChips>
        <ComboboxValue>
          {value.map((item) => (
            <ComboboxChip key={item}>{item}</ComboboxChip>
          ))}
        </ComboboxValue>
        <ComboboxChipsInput id={id} placeholder={value.length === 0 ? placeholder : undefined} />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>{ptBR.admin.products.form.optionsEmpty}</ComboboxEmpty>
        <ComboboxList>{(item: string) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}</ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
