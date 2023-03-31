import React, { FC, useEffect, useRef } from "react";

export const SmallViewportWarning: FC = () => {
  const container = useRef<HTMLDivElement>();

  useEffect(() => {
    setTimeout(() => {
      container.current.classList.add("visible");
    }, 1000);
  }, []);

  return (
    <div className="small-viewport-warning" ref={container}>
      <div className="message">
        The Grid View provides better experience on larger screens.
      </div>
    </div>
  );
};
