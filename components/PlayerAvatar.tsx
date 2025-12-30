import React from 'react';
import { Crown } from 'lucide-react';

interface PlayerAvatarProps {
  avatar?: string;
  color?: string;
  isHost?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCrown?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-10 h-10 text-2xl',
  lg: 'w-14 h-14 text-3xl',
};

const crownSizes = { sm: 16, md: 18, lg: 22 };

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatar,
  color,
  isHost = false,
  size = 'md',
  showCrown = true,
}) => {
  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center shadow-lg transition-all`;

  const displayAvatar = avatar || '👤';
  const displayColor = color || '#64748B';

  if (isHost && showCrown) {
    return (
      <div className={`${baseClasses} bg-yellow-500 text-slate-900 border-2 border-yellow-400`}>
        <Crown size={crownSizes[size]} />
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} border-2`}
      style={{
        backgroundColor: `${displayColor}20`,
        borderColor: displayColor,
        color: displayColor,
      }}
    >
      <span className="filter drop-shadow-sm">{displayAvatar}</span>
    </div>
  );
};
