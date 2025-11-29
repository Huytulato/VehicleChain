import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '200px'),
  };

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${className}`}
      style={style}
    ></div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <Skeleton variant="rectangular" height="150px" />
      <Skeleton variant="text" width="70%" />
      <Skeleton variant="text" width="50%" />
      <div className="flex gap-2 mt-4">
        <Skeleton variant="rectangular" width="100px" height="36px" />
        <Skeleton variant="rectangular" width="100px" height="36px" />
      </div>
    </div>
  );
};

export default Skeleton;
