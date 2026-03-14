"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Filters } from "@/types/company";

interface OptionalFiltersProps {
  hints: Filters;
  onHintsChange: (hints: Filters) => void;
}

const companyTypes = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "health", label: "Healthcare" },
  { value: "fintech", label: "Fintech" },
  { value: "saas", label: "SaaS" },
  { value: "technology", label: "Technology" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

const turnoverRanges = [
  { value: "1-10", label: "$1M - $10M" },
  { value: "10-50", label: "$10M - $50M" },
  { value: "50-100", label: "$50M - $100M" },
  { value: "100-500", label: "$100M - $500M" },
  { value: "500-1000", label: "$500M - $1B" },
  { value: "1000-5000", label: "$1B - $5B" },
  { value: "5000+", label: "$5B+" },
  { value: "custom", label: "Custom Amount" },
];

const headcountRanges = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-100", label: "51-100 employees" },
  { value: "101-250", label: "101-250 employees" },
  { value: "251-500", label: "251-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1001-5000", label: "1001-5000 employees" },
  { value: "5001-10000", label: "5001-10000 employees" },
  { value: "10000+", label: "10000+ employees" },
  { value: "custom", label: "Custom Number" },
];

export function OptionalFilters({ hints, onHintsChange }: OptionalFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { control, watch, register } = useForm<Filters>({
    defaultValues: hints,
  });

  const watchedType = watch("type");
  const watchedTurnover = watch("turnover");
  const watchedHeadcount = watch("headcount");

  React.useEffect(() => {
    const subscription = watch((value) => {
      onHintsChange(value as Filters);
    });
    return () => subscription.unsubscribe();
  }, [watch, onHintsChange]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between"
      >
        <span>Advanced Filters (Optional)</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-4 p-6 rounded-lg border bg-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Category</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {watchedType === "other" && (
                <Input
                  {...register("typeCustom")}
                  placeholder="Specify business type"
                  className="mt-2"
                />
              )}
            </div>

            {/* Revenue Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Revenue</label>
              <Controller
                name="turnover"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {turnoverRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {watchedTurnover === "custom" && (
                <Input
                  {...register("turnoverCustom", { valueAsNumber: true })}
                  type="number"
                  placeholder="Amount in millions USD"
                  className="mt-2"
                />
              )}
            </div>

            {/* Employee Count */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee Count</label>
              <Controller
                name="headcount"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {headcountRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {watchedHeadcount === "custom" && (
                <Input
                  {...register("headcountCustom", { valueAsNumber: true })}
                  type="number"
                  placeholder="Number of employees"
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}