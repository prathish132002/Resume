import React from 'react';

export const Logo = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background - Brand Violet rounded square */}
    <rect width="100" height="100" rx="22" fill="#7c3aed" />
    
    {/* Document Icon - White */}
    <path 
      d="M32 26C32 23.7909 33.7909 22 36 22H64C66.2091 22 68 23.7909 68 26V74C68 76.2091 66.2091 78 64 78H36C33.7909 78 32 76.2091 32 74V26Z" 
      fill="white" 
    />
    
    {/* Document Lines - Light Brand */}
    <rect x="40" y="34" width="20" height="4" rx="2" fill="#ede9fe" />
    <rect x="40" y="42" width="20" height="4" rx="2" fill="#ede9fe" />
    <rect x="40" y="50" width="20" height="4" rx="2" fill="#ede9fe" />
    <rect x="40" y="58" width="12" height="4" rx="2" fill="#ede9fe" />

    {/* Checkmark Badge - Accent Teal with White Check */}
    <g filter="url(#filter0_d_logo)">
        <circle cx="70" cy="70" r="16" fill="#14b8a6" stroke="white" strokeWidth="4"/>
        <path d="M64 70L68 74L76 66" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    
    <defs>
        <filter id="filter0_d_logo" x="50" y="50" width="40" height="40" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
    </defs>
  </svg>
);
