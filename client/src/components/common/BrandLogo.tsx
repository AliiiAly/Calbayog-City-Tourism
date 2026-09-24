import React from "react";

interface BrandLogoProps {
  logoSize?: number;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  logoSize = 32,
  className = "",
}) => {
  return (
    <div className={`header-brand ${className}`}>
      {/* Logo */}
      <div className="header-brand-mark">
        <svg
          width={logoSize}
          height={logoSize}
          viewBox="0 0 500 500"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          role="img"
        >
          {/* Rounded green square */}
          <rect
            x="0"
            y="0"
            width="500"
            height="500"
            rx="78"
            fill="#2F7D5A"
          />

          {/* C letter */}
          <path
            fill="#FFFFFF"
            d="
              M361 136
              H312
              L291 155
              L268 172
              L254 159
              L241 150
              L215 139
              L201 137
              L176 136
              L152 139
              L135 145
              L119 154
              L104 165
              L90 181
              L79 199
              L70 226
              L68 239
              L69 270
              L75 292
              L85 312
              L98 329
              L110 340
              L136 355
              L154 361
              L168 362
              L174 364
              L191 364
              L197 362
              L216 360
              L239 350
              L259 335
              L270 324
              L242 296
              L229 308
              L212 318
              L199 322
              L177 322
              L155 317
              L140 308
              L127 295
              L116 276
              L111 255
              L112 237
              L121 213
              L138 193
              L156 182
              L174 177
              L196 177
              L213 182
              L230 192
              L245 208
              L252 221
              L254 221
              L285 204
              L314 184
              L346 155
              Z
            "
          />

          {/* Light green circle */}
          <circle
            cx="185"
            cy="250"
            r="46"
            fill="#A8D5BA"
          />

          {/* Stylized T */}
          <path
            fill="#A8D5BA"
            d="
              M431 136
              H394
              L381 155
              L352 185
              L310 219
              V363
              L363 362
              V185
              L365 183
              L431 183
              Z
            "
          />
        </svg>
      </div>

      {/* Brand text */}
      <div className="header-brand-copy">
        <span className="header-brand-name">
          Calbayog
        </span>

        <span className="header-brand-type">
          City Tourism
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;