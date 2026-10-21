import React from "react";

export const EcgBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* Soft gradient ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-100/40 blur-[120px]" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-100/30 blur-[140px]" />
      <div className="absolute bottom-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-blue-100/35 blur-[130px]" />

      {/* Floating Medical Cross / Plus Signs */}
      <div className="absolute top-[18%] left-[8%] text-teal-300/35 text-2xl font-light animate-float">
        +
      </div>
      <div className="absolute top-[28%] right-[12%] text-cyan-300/35 text-3xl font-light animate-float [animation-delay:2s]">
        +
      </div>
      <div className="absolute bottom-[22%] left-[15%] text-blue-300/35 text-2xl font-light animate-float [animation-delay:4s]">
        +
      </div>
      <div className="absolute top-[65%] right-[22%] text-teal-300/35 text-3xl font-light animate-float [animation-delay:1.5s]">
        +
      </div>

      {/* Subtle pulsing ECG trace across the top */}
      <svg
        className="absolute top-16 left-0 w-full h-24 opacity-15"
        viewBox="0 0 1200 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 L300,50 L315,20 L330,85 L345,10 L360,65 L375,50 L750,50 L765,20 L780,85 L795,10 L810,65 L825,50 L1200,50"
          stroke="#0EA5A4"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
