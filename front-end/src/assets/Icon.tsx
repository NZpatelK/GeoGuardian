export const markerIcon = new H.map.Icon(
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 28 28" overflow="visible">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="black" />
        </filter>
      </defs>
      <circle cx="14" cy="14" r="10" fill="#0000FF" stroke="#FFFFFF" stroke-width="3" filter="url(#shadow)" />
      <circle cx="14" cy="14" r="7" fill="#0000FF" filter="url(#shadow)" />
    </svg>`,
  { size: { w: 28, h: 28 }, anchor: { x: 14, y: 14 } }
);

// export const labelIcon = (labelName: string) => {
//   return (
//     new H.map.Icon(
//       `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
//     <rect x="0" y="0" width="120" height="40" fill="#FFFFFF" stroke="#000000" stroke-width="2" rx="5" ry="5" />
//     <text x="60" y="25" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#000000">
//       ${labelName}
//     </text>
//   </svg>`,
//       { size: { w: 120, h: 40 }, anchor: { x: 60, y: 20 } }
//     )// Anchor at the center of the label
//   )
// };

export const labelIcon = (labelName: string) => {
  return new H.map.Icon(
    `<svg width="155" height="65" viewBox="0 0 155 65" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#filter0_bd_222_7)">
    <rect x="6" y="2" width="143" height="53" rx="10" fill="#FFFFFF" shape-rendering="crispEdges" />
  </g>
  <text x="77.5" y="32.5" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#000000">
    ${labelName}
  </text>
  <defs>
    <filter id="filter0_bd_222_7" x="0" y="0" width="155" height="65" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feOffset dx="0" dy="2" result="offsetBlur" />
      <feFlood flood-color="rgba(0, 0, 0, 0.2)" />
      <feComposite in2="offsetBlur" operator="in" result="shadow" />
      <feBlend in="SourceGraphic" in2="shadow" mode="normal" />
    </filter>
  </defs>
</svg>
`,
    { size: { w: 155, h: 65 }, anchor: { x: 77.5, y: 32.5 } } // Adjust anchor to center
  );
};