'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  progress: number
  className?: string
  showPercentage?: boolean
  animated?: boolean
  color?: 'blue' | 'green' | 'purple' | 'orange'
}

export function ProgressBar({ 
  progress, 
  className, 
  showPercentage = true, 
  animated = true,
  color = 'blue' 
}: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500', 
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        {animated ? (
          <motion.div
            className={cn('h-2.5 rounded-full', colorClasses[color])}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <div
            className={cn('h-2.5 rounded-full', colorClasses[color])}
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </div>
  )
}