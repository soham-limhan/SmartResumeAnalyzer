import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';

/**
 * PricingCard — premium pricing tier card with feature list and CTA.
 */
export default function PricingCard({
  plan,
  price,
  period = '/month',
  description,
  features,
  cta,
  highlighted = false,
  badge = null,
  index = 0,
  onSelect,
}) {
  return (
    <motion.div
      className={`relative rounded-2xl p-7 border flex flex-col gap-6 transition-all duration-300
        ${highlighted
          ? 'pricing-highlight border-primary/50 shadow-xl shadow-primary/5'
          : 'glass border-white/8'
        }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
    >
      {/* Popular badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="w-3 h-3" />
            {badge}
          </div>
        </div>
      )}

      {/* Plan header */}
      <div>
        <h3 className="font-heading font-bold text-base text-foreground mb-1">{plan}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Price */}
      <div className="flex items-end gap-1">
        {price === 0 || price === 'Free' ? (
          <span className="text-4xl font-heading font-bold text-foreground">Free</span>
        ) : (
          <>
            <span className="text-2xl font-heading font-semibold text-muted-foreground mt-1">$</span>
            <span className="text-4xl font-heading font-bold text-foreground">{price}</span>
            <span className="text-sm text-muted-foreground mb-1.5">{period}</span>
          </>
        )}
      </div>

      {/* Features list */}
      <ul className="space-y-2.5 flex-1">
        {features.map(({ text, included }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm">
            {included ? (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
            )}
            <span className={included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>
              {text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
          ${highlighted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5'
            : 'bg-white/8 text-foreground hover:bg-white/12 border border-white/10'
          }`}
      >
        {cta}
      </button>
    </motion.div>
  );
}
