import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import './RockPopup.scss'

export type PopupVariant =
  | 'centerPop'
  | 'bottomSlide'
  | 'reward'
  | 'bookFlip'
  | 'zoomFromIcon'

interface RockPopupProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  variant?: PopupVariant
  showMask?: boolean
  showParticles?: boolean
  onAnimationComplete?: () => void
  sound?: 'none' | 'ding' | 'whoosh' | 'victory' | 'typewriter'
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
}

export function RockPopup({
  open,
  onClose,
  title,
  children,
  variant = 'centerPop',
  showMask = true,
  showParticles = false,
  onAnimationComplete,
  sound = 'ding'
}: RockPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!open) {
      setIsAnimating(false)
      return
    }

    setIsAnimating(true)

    if (sound !== 'none') {
      playSound(sound)
    }

    if (showParticles && variant === 'reward') {
      generateParticles()
    }

    if (onAnimationComplete) {
      const timer = window.setTimeout(onAnimationComplete, getDurationByVariant(variant))
      return () => window.clearTimeout(timer)
    }
  }, [open, onAnimationComplete, showParticles, sound, variant])

  const getDurationByVariant = (currentVariant: PopupVariant) => {
    const durations: Record<PopupVariant, number> = {
      centerPop: 350,
      bottomSlide: 350,
      reward: 500,
      bookFlip: 600,
      zoomFromIcon: 400
    }

    return durations[currentVariant]
  }

  const generateParticles = () => {
    const count = 24
    const nextParticles: Particle[] = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const velocity = 2 + Math.random() * 3
      nextParticles.push({
        id: i,
        x: 50,
        y: 50,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        size: 4 + Math.random() * 8,
        color: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB'][Math.floor(Math.random() * 4)]
      })
    }

    setParticles(nextParticles)
    animateParticles(nextParticles)
  }

  const animateParticles = (initialParticles: Particle[]) => {
    let frameCount = 0
    const maxFrames = 60

    const animate = () => {
      frameCount += 1

      if (frameCount < maxFrames) {
        setParticles(
          initialParticles.map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.1,
            life: 1 - frameCount / maxFrames
          }))
        )

        window.requestAnimationFrame(animate)
      } else {
        setParticles([])
      }
    }

    window.requestAnimationFrame(animate)
  }

  const playSound = (_type: string) => {
    return
  }

  if (!open) return null

  return (
    <>
      {showMask && <Box className={`mask ${isAnimating ? 'visible' : ''}`} onClick={onClose} />}

      <Box className={`popup p--${variant} ${isAnimating ? 'in' : 'out'}`}>
        <Card className="p-card">
          {title && (
            <Box className="p-header">
              <Typography variant="h4" className="p-title">
                {title}
              </Typography>
              <Box className="p-close" onClick={onClose}>
                x
              </Box>
            </Box>
          )}

          <CardContent className="p-content">{children}</CardContent>

          <Box className="p-footer">
            <Button variant="contained" onClick={onClose} className="p-btn">
              OK
            </Button>
          </Box>
        </Card>
      </Box>

      {particles.length > 0 && (
        <svg
          className="p-particles"
          width="100%"
          height="100%"
          style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {particles.map((particle) => (
            <circle
              key={particle.id}
              cx={`${particle.x}%`}
              cy={`${particle.y}%`}
              r={particle.size}
              fill={particle.color}
              opacity={particle.life}
            />
          ))}
        </svg>
      )}
    </>
  )
}

export function RewardPopup({
  open,
  onClose,
  reward = 'Coins +100',
  onAnimationComplete
}: {
  open: boolean
  onClose: () => void
  reward?: string
  onAnimationComplete?: () => void
}) {
  return (
    <RockPopup
      open={open}
      onClose={onClose}
      title="Reward"
      variant="reward"
      showParticles={true}
      sound="victory"
      onAnimationComplete={onAnimationComplete}
    >
      <Box className="reward-popup__content" sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="h5" sx={{ mb: 1, color: '#FFD700' }}>
          Reward
        </Typography>
        <Typography variant="h6">{reward}</Typography>
      </Box>
    </RockPopup>
  )
}

export function ConfirmPopup({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?'
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
}) {
  return (
    <RockPopup open={open} onClose={onClose} title={title} variant="centerPop" sound="ding">
      <Box className="confirm-popup__content" sx={{ py: 2 }}>
        <Typography sx={{ mb: 2 }}>{message}</Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={onConfirm}>
            Confirm
          </Button>
        </Stack>
      </Box>
    </RockPopup>
  )
}
