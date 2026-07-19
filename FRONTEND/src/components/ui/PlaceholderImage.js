import React, { useState } from 'react';
import { resolveImageUrl } from '../../api';

const PLACEHOLDER_SRC = '/placeholder-product.svg';

/**
 * <img> with a real placeholder fallback — used instead of relying on
 * product.image_url being truthy (which also doesn't catch broken URLs).
 */
const PlaceholderImage = ({ src, alt = '', className = '' }) => {
  const [errored, setErrored] = useState(false);
  const resolvedSrc = !src || errored ? PLACEHOLDER_SRC : resolveImageUrl(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setErrored(true)}
      className={className}
    />
  );
};

export default PlaceholderImage;
