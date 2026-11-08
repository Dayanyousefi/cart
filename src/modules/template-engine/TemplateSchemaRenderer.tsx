import React from 'react';
import {
  type ValidatedTemplateSpec,
  type CanvasElementSpec,
  type SupportedLocale,
} from './template-schema.ts';
import { Lock } from 'lucide-react';

export interface TemplateSchemaRendererProps {
  template: ValidatedTemplateSpec;
  locale?: SupportedLocale;
  customElements?: CanvasElementSpec[];
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  showLockedBadges?: boolean;
  scale?: number;
}

export const TemplateSchemaRenderer: React.FC<TemplateSchemaRendererProps> = ({
  template,
  locale = 'fa',
  customElements,
  selectedElementId = null,
  onSelectElement,
  showLockedBadges = false,
  scale = 1,
}) => {
  const isRtl = locale === 'fa' || locale === 'ar';
  const elements = [...(customElements ?? template.elements)].sort((a, b) => a.zIndex - b.zIndex);
  const { palette, canvasWidth, canvasHeight } = template;

  const getLocalizedElementText = (el: CanvasElementSpec): string => {
    if (locale === 'en') return el.textEn || el.textFa;
    if (locale === 'ar') return el.textAr || el.textFa;
    return el.textFa;
  };

  const getBorderDecorationClass = () => {
    switch (palette.borderStyle) {
      case 'DOUBLE_GOLD':
        return 'ring-2 ring-[#C5A059]/60 shadow-[inset_0_0_0_8px_rgba(197,160,89,0.12)]';
      case 'PERSIAN_ARCH':
        return 'rounded-t-[110px] ring-2 ring-[#D4AF37]/70';
      case 'FLORAL_BOTANICAL':
        return 'ring-1 ring-[#B87D6B]/50 shadow-[inset_0_0_0_10px_rgba(184,125,107,0.08)]';
      case 'MODERN_BOLD':
        return 'ring-2 ring-[#C5A059]';
      case 'MINIMAL_HAIRLINE':
      default:
        return 'ring-1 ring-slate-900/20';
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={locale}
      style={{
        width: `${canvasWidth * scale}px`,
        height: `${canvasHeight * scale}px`,
        backgroundColor: palette.surfaceHex,
        color: palette.primaryTextHex,
      }}
      className={`relative overflow-hidden rounded-2xl shadow-xl transition-all select-none ${getBorderDecorationClass()}`}
    >
      <div
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top right',
        }}
        className="relative w-full h-full"
      >
        {elements.map((el) => {
          const isSelected = selectedElementId === el.id;
          const localizedText = getLocalizedElementText(el);

          if (el.type === 'ORNAMENT_FRAME') {
            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  borderColor: el.fill,
                  opacity: el.opacity,
                  transform: `rotate(${el.rotation}deg)`,
                }}
                className={`absolute border-2 pointer-events-auto transition-shadow ${
                  palette.borderStyle === 'PERSIAN_ARCH'
                    ? 'rounded-t-[95px] rounded-b-xl'
                    : 'rounded-xl'
                } ${isSelected ? 'ring-2 ring-amber-500' : ''}`}
              >
                {/* Ornamental Corner Dots */}
                <span
                  style={{ backgroundColor: el.fill }}
                  className="absolute -top-1.5 -right-1.5 w-3 h-3 rotate-45"
                />
                <span
                  style={{ backgroundColor: el.fill }}
                  className="absolute -top-1.5 -left-1.5 w-3 h-3 rotate-45"
                />
                <span
                  style={{ backgroundColor: el.fill }}
                  className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rotate-45"
                />
                <span
                  style={{ backgroundColor: el.fill }}
                  className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rotate-45"
                />
                {showLockedBadges && el.isLocked && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>قفل تزئینی</span>
                  </span>
                )}
              </div>
            );
          }

          if (el.type === 'BADGE') {
            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  color: el.fill,
                  borderColor: palette.accentGoldHex,
                  fontFamily: el.fontFamily,
                  fontSize: `${el.fontSize}px`,
                  fontWeight: el.fontWeight,
                  letterSpacing: `${el.letterSpacing}px`,
                  lineHeight: el.lineHeight,
                  opacity: el.opacity,
                  transform: `rotate(${el.rotation}deg)`,
                }}
                className={`absolute rounded-xl border px-4 flex items-center justify-center text-center tabular-nums cursor-pointer ${
                  isSelected ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'bg-black/[0.03]'
                }`}
              >
                {localizedText}
              </div>
            );
          }

          if (el.type === 'IMAGE_PLACEHOLDER' && el.imageUrl) {
            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement?.(el.id);
                }}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  opacity: el.opacity,
                  transform: `rotate(${el.rotation}deg)`,
                }}
                className={`absolute overflow-hidden rounded-xl border border-amber-500/40 cursor-pointer ${
                  isSelected ? 'ring-2 ring-amber-500' : ''
                }`}
              >
                <img src={el.imageUrl} alt={el.name} className="w-full h-full object-cover" />
              </div>
            );
          }

          return (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement?.(el.id);
              }}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                minHeight: `${el.height}px`,
                color: el.fill,
                fontFamily: el.fontFamily,
                fontSize: `${el.fontSize}px`,
                fontWeight: el.fontWeight,
                letterSpacing: `${el.letterSpacing}px`,
                lineHeight: el.lineHeight,
                textAlign: el.align,
                opacity: el.opacity,
                transform: `rotate(${el.rotation}deg)`,
              }}
              className={`absolute px-2 py-1 flex items-center justify-center cursor-pointer transition-shadow ${
                isSelected ? 'ring-2 ring-amber-500 rounded-lg bg-amber-500/5' : ''
              }`}
            >
              <span className="w-full">{localizedText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
