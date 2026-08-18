import React from 'react';

interface LogoProps {
  size?: 'default' | 'large';
}

export default function Logo({ size = 'default' }: LogoProps) {
  const logoSize = size === 'large' ? 'h-24 w-24' : 'h-12 w-12';

  return (
    <div className={`flex items-center justify-center h-${size === 'large' ? '24' : '16'}`}>
      <img
        src="/w4ltkzoyz3bns38jhlgx3h94zhqg.png"
        alt="e2vc"
        className="h-10 object-contain scale-[4] origin-center"
      />
    </div>
  );
}