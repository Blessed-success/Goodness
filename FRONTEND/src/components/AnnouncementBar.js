/**
 * AnnouncementBar
 * Slim, dismissible promotional strip shown above the header, driven by the
 * admin-editable hero banner's announcement fields.
 */

import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { heroBannerAPI } from '../api';

const DISMISS_KEY_PREFIX = 'announcement-dismissed:';

const AnnouncementBar = () => {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;

    heroBannerAPI.getActive()
      .then((response) => {
        if (!active) return;
        const data = response.data.data;
        if (data?.announcement_text) {
          setBanner(data);
          setDismissed(sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${data.id}`) === '1');
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  if (!banner || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(`${DISMISS_KEY_PREFIX}${banner.id}`, '1');
    setDismissed(true);
  };

  const content = (
    <span className="truncate">{banner.announcement_text}</span>
  );

  return (
    <div className="relative flex items-center justify-center gap-3 bg-primary-800 px-10 py-2 text-center text-xs font-medium text-white sm:text-sm">
      {banner.announcement_link ? (
        <a href={banner.announcement_link} className="truncate hover:underline">
          {content}
        </a>
      ) : content}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 text-white/70 transition-colors hover:text-white"
      >
        <FiX size={14} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
