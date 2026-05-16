import React from 'react';

export const Skeleton = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`bg-stone-100 animate-pulse rounded-md ${className}`} />
  );
};

export const ProductSkeleton = () => {
  return (
    <div className="bistro-card flex items-center justify-between gap-4">
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/4 mt-1" />
      </div>
      <Skeleton className="w-12 h-10 rounded-xl" />
    </div>
  );
};
