/**
 * Hero
 * Full-width homepage hero: autoplaying muted video (or an animated
 * gradient/poster fallback until the admin uploads one), flash-sale ribbon,
 * countdown, scrolling offer ticker, and the Shop Now / View Deals /
 * Watch Video CTAs. Content is fully driven by the admin-editable
 * HeroBanner, falling back to sensible defaults when none is configured.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiPlay, FiCreditCard, FiMessageCircle, FiMapPin, FiZap } from 'react-icons/fi';
import Button from '../ui/Button';
import CountdownTimer from './CountdownTimer';
import OfferTicker from './OfferTicker';
import WatchVideoModal from './WatchVideoModal';
import { resolveImageUrl } from '../../api';

const TRUST_POINTS = [
  { icon: FiCreditCard, label: 'Secure payments via Paystack' },
  { icon: FiMessageCircle, label: 'Order direct on WhatsApp' },
  { icon: FiMapPin, label: 'Delivery across Ghana' },
];

const DEFAULTS = {
  badge_text: 'Wholesale Marketplace · Ghana',
  headline: 'Wholesale, sourced right\nand delivered fast',
  subheading: 'Quality products at competitive bulk prices, with secure checkout and delivery across Ghana.',
  cta_shop_text: 'Shop Now',
  cta_shop_link: '/products',
  cta_deals_text: 'View Deals',
  cta_deals_link: '/products?flash_sale=true',
  show_watch_video: true,
  video_url: null,
  poster_image_url: null,
  flash_sale_label: null,
  ticker_text: null,
  countdown_enabled: false,
  countdown_end: null,
  countdown_label: 'Flash Sale Ends In',
};

const Hero = ({ banner }) => {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);
  const b = { ...DEFAULTS, ...(banner || {}) };

  const videoUrl = resolveImageUrl(b.video_url);
  const posterUrl = resolveImageUrl(b.poster_image_url);
  const hasImage = Boolean(videoUrl || posterUrl);

  const goTo = (link) => {
    if (!link) return;
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link);
    }
  };

  return (
    <div className="relative overflow-hidden bg-primary-900">
      {/* Background layer */}
      <div className="absolute inset-0">
        {videoUrl ? (
          <video
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={posterUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : posterUrl ? (
          <div
            className="h-full w-full animate-ken-burns bg-cover bg-center"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
            <div className="absolute right-[-10%] top-[-15%] h-80 w-80 animate-float rounded-full bg-accent-400/20 blur-3xl" />
            <div className="absolute bottom-[-15%] left-[20%] h-72 w-72 animate-float rounded-full bg-primary-300/10 blur-3xl" style={{ animationDelay: '1.5s' }} />
          </div>
        )}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Mobile: text spans nearly the full width, so darken the whole banner evenly top-to-bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-900/85 to-primary-900/65 md:hidden" />
        {/* Desktop: keep the banner clean on the right; fade smoothly into a solid backdrop behind the text column on the left — no hard edge */}
        {hasImage && (
          <div
            className="absolute inset-0 hidden md:block"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(12,42,29,0.96) 0%, rgba(12,42,29,0.92) 34%, rgba(12,42,29,0.5) 50%, rgba(12,42,29,0) 66%), linear-gradient(to top, rgba(12,42,29,0.85) 0%, rgba(12,42,29,0.1) 55%, rgba(12,42,29,0) 80%)',
            }}
          />
        )}
        {!hasImage && (
          <div className="absolute inset-0 hidden bg-gradient-to-t from-primary-900/95 via-primary-900/60 to-primary-900/40 md:block" />
        )}
      </div>

      {/* Flash sale ribbon */}
      {b.flash_sale_label && (
        <div className="absolute right-4 top-4 z-10 flex animate-pulse-glow items-center gap-1.5 rounded-full bg-accent-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-900 shadow-lg sm:right-8 sm:top-8">
          <FiZap size={13} /> {b.flash_sale_label}
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 md:py-24">
        <span className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-100">
          {b.badge_text}
        </span>
        <h1
          className={`mb-5 whitespace-pre-line text-4xl font-bold leading-tight text-white [text-shadow:0_2px_10px_rgb(0_0_0_/_35%)] md:text-5xl lg:text-6xl ${hasImage ? 'max-w-xl' : 'max-w-2xl'}`}
        >
          {b.headline}
        </h1>
        <p className={`mb-8 text-lg text-primary-100 [text-shadow:0_1px_6px_rgb(0_0_0_/_35%)] ${hasImage ? 'max-w-sm' : 'max-w-lg'}`}>
          {b.subheading}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => goTo(b.cta_shop_link)}>
            {b.cta_shop_text} <FiArrowRight />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => goTo(b.cta_deals_link)}
            className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10"
          >
            {b.cta_deals_text}
          </Button>
          {b.show_watch_video && videoUrl && (
            <button
              onClick={() => setVideoOpen(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors hover:text-accent-300"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <FiPlay size={14} />
              </span>
              Watch Video
            </button>
          )}
        </div>

        {b.countdown_enabled && b.countdown_end && (
          <CountdownTimer endTime={b.countdown_end} label={b.countdown_label} className="mt-8" />
        )}

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-primary-100">
              <Icon size={16} className="text-accent-400" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <OfferTicker text={b.ticker_text} className="relative" />

      {videoOpen && videoUrl && (
        <WatchVideoModal videoUrl={videoUrl} onClose={() => setVideoOpen(false)} />
      )}
    </div>
  );
};

export default Hero;
