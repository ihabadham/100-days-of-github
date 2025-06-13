"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-semibold text-white drop-shadow-sm",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-8 w-8 bg-gradient-to-br from-purple-600/70 to-purple-500/60 backdrop-blur-sm border border-purple-300/50 rounded-full p-0 text-white hover:from-purple-500/80 hover:to-purple-400/70 hover:border-purple-200/60 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-600/30 flex items-center justify-center"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mb-2",
        head_cell:
          "w-10 h-8 mx-0.5 text-white/90 font-medium text-xs flex items-center justify-center bg-gradient-to-br from-purple-700/60 to-purple-600/50 backdrop-blur-sm border border-purple-400/40 rounded-lg shadow-sm shadow-purple-700/20 mx-0",
        row: "flex w-full mt-1",
        cell: "w-10 h-10 p-0 mx-0.5",
        day: cn(
          "w-full h-full p-0 font-medium text-sm rounded-xl transition-all duration-300 text-white bg-gradient-to-br from-purple-800/50 to-purple-700/45 backdrop-blur-sm border border-purple-400/40 hover:from-purple-600/70 hover:to-purple-500/65 hover:border-purple-300/60 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/25 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center shadow-sm shadow-purple-800/20"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-br from-purple-500 to-purple-400 text-white border-purple-300/60 shadow-xl shadow-purple-500/40 hover:from-purple-600 hover:to-purple-500 hover:shadow-xl hover:shadow-purple-600/45 scale-105",
        day_today:
          "bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold border-yellow-400/60 shadow-lg shadow-yellow-500/30 hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg hover:shadow-yellow-600/35",
        day_outside:
          "text-white/40 bg-gradient-to-br from-purple-900/30 to-purple-800/25 hover:from-purple-800/40 hover:to-purple-700/35 hover:text-white/60 border-purple-600/25 shadow-sm shadow-purple-900/15",
        day_disabled:
          "text-white/25 opacity-30 cursor-not-allowed bg-gradient-to-br from-purple-900/20 to-purple-800/15 hover:scale-100 shadow-sm shadow-purple-900/10",
        day_range_middle:
          "bg-gradient-to-r from-purple-600/60 to-purple-500/55 text-white border-purple-400/50 shadow-sm shadow-purple-600/20",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
