import React, { FC, ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  rightAction?: ReactNode;
}

const DashboardHeader: FC<Props> = ({
  icon,
  title,
  description,
  rightAction,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-zinc-800/50">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="space-y-1">
          <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-300 via-white to-emerald-300 bg-clip-text text-transparent">{title}</h1>
          <p className="text-zinc-400 text-sm">{description}</p>
        </div>
      </div>
      {rightAction}
    </div>
  );
};

export default DashboardHeader;
