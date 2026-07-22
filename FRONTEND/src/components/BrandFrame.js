/**
 * BrandFrame
 * Thin deep-green bars bookending the site, used above the header and
 * below the footer to give the whole platform a consistent luxury frame.
 */

import React from 'react';

const BrandFrame = () => (
  <div
    className="h-1.5 w-full bg-gradient-to-r from-primary-800 via-primary-600 to-primary-800 md:h-2"
    aria-hidden="true"
  />
);

export default BrandFrame;
