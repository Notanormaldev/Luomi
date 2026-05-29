import React from 'react'
import { DiJira } from "react-icons/di";

function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 select-none logo-container">
      {/* Metallic SVG Gradient definitions and Icon */}
      <div className="relative flex items-center justify-center" style={{ width: '28px', height: '28px' }}>
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="metallic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C0C0C0" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#888888" />
            </linearGradient>
            <linearGradient id="dark-metallic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#555555" />
              <stop offset="50%" stopColor="#111111" />
              <stop offset="100%" stopColor="#333333" />
            </linearGradient>
          </defs>
        </svg>
        <DiJira size={30} className="logo-icon" />
      </div>
      
      {/* Text "LUOMI" */}
      <span className="logo-text">
        LUOMI
      </span>
    </div>
  )
}

export default Logo
