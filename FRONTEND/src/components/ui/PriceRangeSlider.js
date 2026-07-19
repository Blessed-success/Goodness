import React from 'react';

/**
 * Price range slider: two independent, stacked <input type="range"> controls
 * (min and max) rather than overlapping thumbs on a single track. Overlapping
 * dual-thumb sliders rely on a pointer-events CSS trick that is fragile across
 * browsers; two plain sliders are simple and reliably draggable.
 */
const PriceRangeSlider = ({ min, max, value, onChange }) => {
  const [minVal, maxVal] = value;

  const handleMinChange = (e) => {
    const next = Math.min(Number(e.target.value), maxVal);
    onChange([next, maxVal]);
  };

  const handleMaxChange = (e) => {
    const next = Math.max(Number(e.target.value), minVal);
    onChange([minVal, next]);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
          <span>Min</span>
          <span className="font-semibold text-gray-900">GHS {minVal.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={minVal}
          onChange={handleMinChange}
          className="range-slider-thumb h-1 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
          <span>Max</span>
          <span className="font-semibold text-gray-900">GHS {maxVal.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={maxVal}
          onChange={handleMaxChange}
          className="range-slider-thumb h-1 w-full cursor-pointer appearance-none rounded-full bg-gray-200"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
