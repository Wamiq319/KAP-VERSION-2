import React from "react";

const Loader = ({ size = 8, opacity = 100 }) => {
  return (
    <div
      className={`border-4 border-solid rounded-full animate-spin`}
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
        borderWidth: `${size / 6}rem`,
        borderTopColor: `rgba(0, 128, 90, ${opacity / 100})`,
        borderRightColor: `rgba(46, 204, 113, ${opacity / 150})`,
        borderBottomColor: `rgba(85, 239, 196, ${opacity / 200})`,
        borderLeftColor: `rgba(29, 178, 115, ${opacity / 150})`,
      }}
    ></div>
  );
};

export default Loader;
