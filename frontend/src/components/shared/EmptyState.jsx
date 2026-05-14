import { motion } from 'framer-motion';
import { FileSearch, Inbox, BarChart3 } from 'lucide-react';

const icons = {
  upload: FileSearch,
  history: Inbox,
  analysis: BarChart3,
};

export default function EmptyState({
  icon = 'upload',
  title = 'Nothing here yet',
  description = 'Get started by uploading your first resume.',
  action = null,
  className = '',
}) {
  const Icon = icons[icon] || FileSearch;

  return (
    <motion.div
      className={`flex flex-col items-center justify-center py-20 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="w-10 h-10 text-primary opacity-60" />
      </motion.div>

      <h3 className="text-xl font-heading font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-6">{description}</p>

      {action && action}
    </motion.div>
  );
}
