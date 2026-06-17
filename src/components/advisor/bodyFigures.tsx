/** Anatomical front-view male figure for spray placement (viewBox 0 0 240 520). */
export function BodyFigureMale() {
  const skin = 'rgba(255,255,255,0.1)';
  const skinDeep = 'rgba(255,255,255,0.06)';
  const outline = 'rgba(255,255,255,0.22)';
  const detail = 'rgba(255,255,255,0.12)';

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="male-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <radialGradient id="male-head-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.07)" />
        </radialGradient>
      </defs>

      {/* Head */}
      <ellipse cx="120" cy="52" rx="28" ry="34" fill="url(#male-head-grad)" stroke={outline} strokeWidth="1.2" />
      {/* Ears */}
      <ellipse cx="88" cy="54" rx="5" ry="8" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      <ellipse cx="152" cy="54" rx="5" ry="8" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Neck */}
      <path d="M108 82 Q120 88 132 82 L128 108 Q120 112 112 108 Z" fill={skin} stroke={outline} strokeWidth="0.8" />
      {/* Shoulders & torso */}
      <path
        d="M68 112 Q120 98 172 112 L182 148 Q188 168 178 188 L168 248 Q162 290 158 340 L148 400 Q120 410 92 400 L82 340 Q78 290 72 248 L62 188 Q52 168 58 148 Z"
        fill="url(#male-body-grad)"
        stroke={outline}
        strokeWidth="1.2"
      />
      {/* Pectoral definition */}
      <path d="M92 138 Q120 152 148 138 Q140 168 120 172 Q100 168 92 138" fill={skinDeep} stroke={detail} strokeWidth="0.6" />
      <line x1="120" y1="148" x2="120" y2="210" stroke={detail} strokeWidth="0.5" opacity="0.6" />
      {/* Abdomen */}
      <path d="M98 210 Q120 218 142 210 Q138 248 120 252 Q102 248 98 210" fill="none" stroke={detail} strokeWidth="0.5" opacity="0.5" />
      {/* Left arm */}
      <path
        d="M68 112 Q48 130 42 168 Q38 210 44 248 Q48 278 52 298 L58 310 Q62 278 64 248 Q66 200 72 168 Q76 138 82 122 Z"
        fill={skin}
        stroke={outline}
        strokeWidth="1"
      />
      <ellipse cx="52" cy="308" rx="10" ry="12" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Right arm */}
      <path
        d="M172 112 Q192 130 198 168 Q202 210 196 248 Q192 278 188 298 L182 310 Q178 278 176 248 Q174 200 168 168 Q164 138 158 122 Z"
        fill={skin}
        stroke={outline}
        strokeWidth="1"
      />
      <ellipse cx="188" cy="308" rx="10" ry="12" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Hips / upper legs (cropped) */}
      <path
        d="M92 400 Q88 440 90 480 L110 484 Q120 478 130 484 L150 480 Q152 440 148 400 Q120 412 92 400"
        fill={skinDeep}
        stroke={outline}
        strokeWidth="1"
      />
      {/* Collarbone hint */}
      <path d="M88 118 Q120 128 152 118" fill="none" stroke={detail} strokeWidth="0.8" />
    </g>
  );
}

/** Anatomical front-view female figure for spray placement (viewBox 0 0 240 520). */
export function BodyFigureFemale() {
  const skin = 'rgba(255,255,255,0.1)';
  const skinDeep = 'rgba(255,255,255,0.06)';
  const outline = 'rgba(255,255,255,0.22)';
  const detail = 'rgba(255,255,255,0.12)';

  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="female-body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <radialGradient id="female-head-grad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.07)" />
        </radialGradient>
      </defs>

      {/* Hair volume */}
      <path
        d="M88 48 Q120 18 152 48 Q162 72 158 92 Q148 78 120 74 Q92 78 82 92 Q78 72 88 48"
        fill="rgba(255,255,255,0.05)"
        stroke={outline}
        strokeWidth="0.8"
      />
      {/* Head */}
      <ellipse cx="120" cy="54" rx="26" ry="32" fill="url(#female-head-grad)" stroke={outline} strokeWidth="1.2" />
      {/* Ears */}
      <ellipse cx="90" cy="56" rx="4.5" ry="7" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      <ellipse cx="150" cy="56" rx="4.5" ry="7" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Neck */}
      <path d="M110 84 Q120 90 130 84 L127 106 Q120 110 113 106 Z" fill={skin} stroke={outline} strokeWidth="0.8" />
      {/* Shoulders — narrower than male */}
      <path
        d="M78 110 Q120 100 162 110 L170 142 Q176 162 168 182 L158 240 Q152 278 148 318 L142 378 Q120 388 98 378 L92 318 Q88 278 82 240 L72 182 Q64 162 70 142 Z"
        fill="url(#female-body-grad)"
        stroke={outline}
        strokeWidth="1.2"
      />
      {/* Waist */}
      <path d="M102 228 Q120 238 138 228 Q132 258 120 262 Q108 258 102 228" fill="none" stroke={detail} strokeWidth="0.5" opacity="0.55" />
      {/* Décolletage */}
      <path d="M98 132 Q120 148 142 132 Q136 158 120 162 Q104 158 98 132" fill={skinDeep} stroke={detail} strokeWidth="0.6" />
      {/* Left arm — slightly narrower */}
      <path
        d="M78 110 Q62 128 56 162 Q52 200 56 238 Q58 272 62 296 L68 306 Q72 272 74 238 Q76 192 80 162 Q84 132 88 118 Z"
        fill={skin}
        stroke={outline}
        strokeWidth="1"
      />
      <ellipse cx="66" cy="304" rx="9" ry="11" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Right arm */}
      <path
        d="M162 110 Q178 128 184 162 Q188 200 184 238 Q182 272 178 296 L172 306 Q168 272 166 238 Q164 192 160 162 Q156 132 152 118 Z"
        fill={skin}
        stroke={outline}
        strokeWidth="1"
      />
      <ellipse cx="174" cy="304" rx="9" ry="11" fill={skinDeep} stroke={outline} strokeWidth="0.8" />
      {/* Hips — wider */}
      <path
        d="M98 378 Q88 418 92 458 L108 468 Q120 462 132 468 L148 458 Q152 418 142 378 Q120 394 98 378"
        fill={skinDeep}
        stroke={outline}
        strokeWidth="1"
      />
      <path d="M92 132 Q120 142 148 132" fill="none" stroke={detail} strokeWidth="0.8" />
    </g>
  );
}

export function BodyFigureNeutral() {
  return <BodyFigureMale />;
}
