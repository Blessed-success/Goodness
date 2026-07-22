/**
 * CountdownTimer
 * Reusable days/hours/minutes/seconds countdown box, used by the hero
 * banner and reusable anywhere else a promotion needs a deadline.
 */

import React, { useEffect, useState } from 'react';

const getTimeLeft = (endTime) => {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const Unit = ({ value, label }) => (
  <div className="flex flex-col items-center rounded-lg bg-white/95 px-2.5 py-1.5 shadow-card sm:px-3 sm:py-2">
    <span className="text-lg font-bold leading-none text-primary-900 sm:text-xl">
      {String(value).padStart(2, '0')}
    </span>
    <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-600">{label}</span>
  </div>
);

const CountdownTimer = ({ endTime, label = 'Offer Ends In', className = '' }) => {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endTime));

  useEffect(() => {
    setTimeLeft(getTimeLeft(endTime));
    const interval = setInterval(() => setTimeLeft(getTimeLeft(endTime)), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!timeLeft) return null;

  return (
    <div className={className}>
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/80">{label}</p>
      )}
      <div className="flex items-center gap-2 sm:gap-3">
        {timeLeft.days > 0 && <Unit value={timeLeft.days} label="Days" />}
        <Unit value={timeLeft.hours} label="Hrs" />
        <Unit value={timeLeft.minutes} label="Min" />
        <Unit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};

export default CountdownTimer;
