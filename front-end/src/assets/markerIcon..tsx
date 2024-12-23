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