import Image from 'next/image';

export default function Logo({ size = 40, showText = true }: { size?: number; showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/bmmu-logo.png"
        alt="Bilal Muslim Mission Uganda crest"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="leading-tight">
          <p className="font-display text-lg font-semibold tracking-wide">BMMU</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-bmmu-black/50 dark:text-bmmu-cream/50">
            Attendance Archive
          </p>
        </div>
      )}
    </div>
  );
}
