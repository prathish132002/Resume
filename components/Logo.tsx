import React from 'react';

export const Logo = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
  <img 
    src="https://res.cloudinary.com/da2szyo01/image/upload/v1773654261/ChatGPT_Image_Mar_16_2026_02_48_23_PM_cqqpef.png" 
    alt="ResumeForge Logo"
    width={size}
    height={size}
    className={`rounded-lg ${className}`}
    referrerPolicy="no-referrer"
  />
);
