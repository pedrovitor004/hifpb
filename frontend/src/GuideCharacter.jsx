import React from "react";

// Each scene has its own prop and gesture; all motion stays in CSS for reduced-motion support.
export default function GuideCharacter({ step }) {
  return (
    <svg
      key={step}
      className={`guide-mascot guide-mascot-${step}`}
      viewBox="0 0 160 150"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="79" cy="80" r="61" className="mascot-backdrop" />
      <g
        className="mascot-sparkles"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M20 38v8m-4-4h8M134 106v8m-4-4h8" />
        <circle cx="134" cy="33" r="3" />
        <circle cx="20" cy="114" r="2" />
      </g>
      <g className="mascot-body">
        <path
          d="M45 133v-30c0-22 58-22 58 0v30"
          fill="currentColor"
          opacity=".2"
        />
        <path
          d="M54 133v-25m40 25v-25"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <g className="mascot-head">
          <circle
            cx="74"
            cy="62"
            r="27"
            fill="var(--color-panel)"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            d="M48 57c-3-34 55-36 54 0-12-1-19-9-24-16-7 12-17 16-30 16Z"
            fill="currentColor"
          />
          <g className="mascot-eyes" fill="currentColor">
            <circle cx="64" cy="64" r="2.5" />
            <circle cx="84" cy="64" r="2.5" />
          </g>
          <path
            d="M66 76q8 7 16 0"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="56" cy="73" r="4" fill="#eea7a0" opacity=".5" />
          <circle cx="92" cy="73" r="4" fill="#eea7a0" opacity=".5" />
          {step === 3 && (
            <g className="mascot-cap">
              <path d="m40 35 34-14 35 14-35 14Z" fill="currentColor" />
              <path
                d="M54 42v11q20 10 40 0V42M107 37v23"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle cx="107" cy="63" r="3" fill="#e4b257" />
            </g>
          )}
        </g>
        <path
          className="mascot-left-arm"
          d="m49 108-14 7"
          stroke="currentColor"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <g className="mascot-right-arm">
          <path
            d="m99 106 14-23"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="m113 83 2-10m-2 10 9-6"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </g>
      <g className="mascot-prop">
        {step === 0 && (
          <g>
            <rect
              x="102"
              y="58"
              width="38"
              height="44"
              rx="5"
              fill="var(--color-panel)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M110 58v44m7-32h16m-16 7h12m-12 7h14"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="m126 52 4-8 4 8" stroke="#e4b257" strokeWidth="2" />
          </g>
        )}
        {step === 1 && (
          <g fill="var(--color-panel)" stroke="currentColor" strokeWidth="2">
            <g className="mascot-student">
              <circle cx="116" cy="69" r="9" />
              <path d="M102 96v-9c0-11 28-11 28 0v9Z" />
            </g>
            <g className="mascot-student mascot-student-second">
              <circle cx="140" cy="83" r="7" />
              <path d="M129 105v-8c0-9 22-9 22 0v8Z" />
            </g>
          </g>
        )}
        {step === 2 && (
          <g>
            <path
              d="M98 68q12-5 24 2 12-7 24-2v34q-12-5-24 2-12-7-24-2Z"
              fill="var(--color-panel)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M122 71v30m-18-23 11 1m-11 7 11 1m14-9 11-1m-11 9 11-1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="mascot-page"
              d="m122 71 16-8v32l-16 6"
              fill="currentColor"
              opacity=".15"
            />
          </g>
        )}
        {step === 3 && (
          <g>
            <rect
              x="101"
              y="76"
              width="43"
              height="28"
              rx="4"
              fill="var(--color-panel)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M109 84h17m-17 6h11"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="134" cy="95" r="5" fill="#e4b257" />
            <path d="m131 99-2 10 5-3 5 3-2-10" fill="#e4b257" />
          </g>
        )}
        {step === 4 && (
          <g>
            <rect
              x="103"
              y="52"
              width="40"
              height="57"
              rx="4"
              fill="var(--color-panel)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="mascot-door"
              d="m110 59 23 5v42l-23-4Z"
              fill="currentColor"
              opacity=".2"
            />
            <circle cx="128" cy="86" r="2" fill="currentColor" />
            <rect
              x="112"
              y="45"
              width="22"
              height="12"
              rx="3"
              fill="currentColor"
            />
            <text
              x="123"
              y="53"
              textAnchor="middle"
              fill="var(--color-panel)"
              fontSize="7"
            >
              204
            </text>
          </g>
        )}
        {step === 5 && (
          <g>
            <circle
              cx="124"
              cy="79"
              r="24"
              fill="var(--color-panel)"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M124 60v3m19 16h-3m-16 19v-3m-19-16h3"
              stroke="currentColor"
              strokeWidth="2"
            />
            <g className="mascot-clock-hand">
              <path
                d="M124 66v13l9 5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
            <circle cx="124" cy="79" r="2" fill="currentColor" />
            <rect
              x="101"
              y="100"
              width="47"
              height="15"
              rx="5"
              fill="currentColor"
            />
            <text
              x="124"
              y="110"
              textAnchor="middle"
              fill="var(--color-panel)"
              fontSize="8"
            >
              18:30
            </text>
          </g>
        )}
        {step === 6 && (
          <g>
            <g className="mascot-plane">
              <path
                d="m102 71 43-18-12 38-13-13Z"
                fill="var(--color-panel)"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m120 78 25-25m-25 25-2 12 9-7"
                stroke="currentColor"
                strokeWidth="2"
              />
            </g>
            <g
              className="mascot-confetti"
              stroke="#e4b257"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="m110 43 3-7m28 65 5 4m-45-2-6 3" />
            </g>
            <circle cx="120" cy="110" r="11" fill="currentColor" />
            <path
              d="m115 110 3 3 7-7"
              stroke="var(--color-panel)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
