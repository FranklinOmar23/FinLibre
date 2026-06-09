export function LibSm({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <ellipse cx="45" cy="58" rx="22" ry="18" fill="#fff" opacity=".9"/>
      <circle cx="45" cy="34" r="20" fill="#fff" opacity=".9"/>
      <ellipse cx="27" cy="20" rx="7" ry="9" fill="#fff" opacity=".9"/>
      <ellipse cx="63" cy="20" rx="7" ry="9" fill="#fff" opacity=".9"/>
      <circle cx="39" cy="31" r="2.2" fill="#0f2318"/>
      <circle cx="53" cy="31" r="2.2" fill="#0f2318"/>
      <path d="M39 41 Q45 47 51 41" stroke="#085041" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function LibFull({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <ellipse cx="45" cy="58" rx="22" ry="18" fill="#1D9E75"/>
      <circle cx="45" cy="34" r="20" fill="#1D9E75"/>
      <ellipse cx="27" cy="20" rx="7" ry="9" fill="#1D9E75"/>
      <ellipse cx="63" cy="20" rx="7" ry="9" fill="#1D9E75"/>
      <ellipse cx="27" cy="20" rx="4" ry="6" fill="#5DCAA5"/>
      <ellipse cx="63" cy="20" rx="4" ry="6" fill="#5DCAA5"/>
      <circle cx="38" cy="30" r="4" fill="#fff"/>
      <circle cx="52" cy="30" r="4" fill="#fff"/>
      <circle cx="39" cy="31" r="2.2" fill="#0f2318"/>
      <circle cx="53" cy="31" r="2.2" fill="#0f2318"/>
      <circle cx="39.8" cy="30.2" r=".8" fill="#fff"/>
      <circle cx="53.8" cy="30.2" r=".8" fill="#fff"/>
      <ellipse cx="45" cy="37" rx="3" ry="2" fill="#085041"/>
      <path d="M39 41 Q45 47 51 41" stroke="#085041" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <ellipse cx="67" cy="55" rx="9" ry="9" fill="#EF9F27"/>
      <ellipse cx="67" cy="55" rx="7" ry="7" fill="#BA7517"/>
      <text x="67" y="59" textAnchor="middle" fontSize="9" fontWeight="700" fill="#EF9F27">$</text>
      <path d="M57 58 Q62 55 67 55" stroke="#0F6E56" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="36" cy="74" rx="7" ry="5" fill="#0F6E56"/>
      <ellipse cx="54" cy="74" rx="7" ry="5" fill="#0F6E56"/>
    </svg>
  );
}
