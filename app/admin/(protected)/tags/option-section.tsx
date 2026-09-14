"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ProductOptionRow } from "@/lib/supabase/types";

export function OptionSection({
  title,
  options,
  onCreate,
  onDelete,
}: {
  title: string;
  options: ProductOptionRow[];
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    await onCreate(trimmed);
    setSubmitting(false);
    setName("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ptBR.admin.tags.namePlaceholder}
          />
          <Button type="submit" disabled={submitting || !name.trim()}>
            <Plus />
            {ptBR.admin.tags.addButton}
          </Button>
        </form>

        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ptBR.admin.tags.listEmpty}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {options.map((option) => (
              <div
                key={option.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{option.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={ptBR.admin.tags.delete}
                    >
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{ptBR.admin.tags.deleteConfirm.title}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {ptBR.admin.tags.deleteConfirm.description}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{ptBR.admin.tags.deleteConfirm.cancel}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(option.id)}>
                        {ptBR.admin.tags.deleteConfirm.confirm}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
