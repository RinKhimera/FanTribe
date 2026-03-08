"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.List
> {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List>>
}

const TabsList = ({ className, ref, ...props }: TabsListProps) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1",
      className,
    )}
    {...props}
  />
)

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>
}

const TabsTrigger = ({ className, ref, ...props }: TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring data-[state=active]:bg-background data-[state=active]:text-foreground inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs",
      className,
    )}
    {...props}
  />
)

interface TabsContentProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Content
> {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>
}

const TabsContent = ({ className, ref, ...props }: TabsContentProps) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
      className,
    )}
    {...props}
  />
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
