import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants: any = {
  hidden:  { opacity: 0, y: 22 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07 },
  },
}

const child: any = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div className="page" variants={variants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  )
}

export function Reveal({ children }: { children: ReactNode }) {
  return <motion.div variants={child}>{children}</motion.div>
}
