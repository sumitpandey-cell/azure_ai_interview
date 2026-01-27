"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"

interface TransitionButtonProps extends ButtonProps {
    href: string
    // transitionColor?: string // Kept for compatibility but unused - Removed as it's unused
}

export function TransitionButton({ href, children, onClick, ...props }: TransitionButtonProps) {
    const router = useRouter()

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // Prevent default navigation if wrapped in Link
        e.preventDefault();

        if (onClick) onClick(e)

        // Simple navigation
        router.push(href)
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`inline-block ${props.className?.includes('w-full') ? 'w-full' : ''}`}
            style={{ width: props.className?.includes('w-full') ? '100%' : 'auto' }}
        >
            <Button onClick={handleClick} {...props} className={props.className}>
                {children}
            </Button>
        </motion.div>
    )
}
