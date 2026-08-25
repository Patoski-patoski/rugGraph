import React from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
  size?: number;
  filled?: boolean;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = '',
  size = 20,
  filled = false,
}) => {
  return (
    <span
      className={`material-symbols-outlined select-none align-middle inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {name}
    </span>
  );
};
