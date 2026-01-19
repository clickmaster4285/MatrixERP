// hooks/useDebounce.js
'use client';

import { useState, useEffect, useRef } from 'react';

export const useDebounce = (value, delay = 300) => {
   const [debouncedValue, setDebouncedValue] = useState(value);
   const timerRef = useRef();

   useEffect(() => {
      timerRef.current = setTimeout(() => {
         setDebouncedValue(value);
      }, delay);

      return () => {
         clearTimeout(timerRef.current);
      };
   }, [value, delay]);

   return debouncedValue;
};