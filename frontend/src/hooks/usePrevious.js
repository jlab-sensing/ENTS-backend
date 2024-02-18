import React, { useState, useEffect, useRef } from 'react';

function usePrevious(value) {
  const ref = useRef();

  // since assigning a value doesn't rerender the app
  // ref is the previous state
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export default usePrevious;
