"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type LookupRequest, type Filters } from "@/types/company";

interface SearchBarProps {
  onSearch: (data: LookupRequest) => void;
  isLoading?: boolean;
  filters?: Filters;
}

export function SearchBar({ onSearch, isLoading = false, filters }: SearchBarProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LookupRequest>({
    defaultValues: {
      companyName: "",
      filters: filters || {},
    },
  });

  const onFormSubmit = (data: LookupRequest) => {
    onSearch({ ...data, filters: filters || {} });
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="w-full">
      <div className="flex w-full gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            {...register("companyName")}
            placeholder="Enter company name (e.g., Microsoft, Apple, Google)"
            className="pl-10"
            disabled={isLoading}
          />
          {errors.companyName && (
            <p className="text-sm text-destructive mt-2">{errors.companyName.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
    </form>
  );
}