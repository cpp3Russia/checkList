import { useState } from 'react'
import { Box, Button, Container, Stack, Typography } from '@mui/material'
import { ConfirmPopup, RewardPopup, RockPopup } from '@/components/RockPopup'

export function RockPopupShowcase() {
  const [popups, setPopups] = useState({
    center: false,
    reward: false,
    confirm: false
  })

  const openPopup = (key: keyof typeof popups) => {
    setPopups((prev) => ({ ...prev, [key]: true }))
  }

  const closePopup = (key: keyof typeof popups) => {
    setPopups((prev) => ({ ...prev, [key]: false }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Popup Showcase
      </Typography>

      <Stack spacing={3}>
        <Box className="rock-popup-showcase__basic">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Basic popup
          </Typography>
          <Button variant="contained" onClick={() => openPopup('center')}>
            Open basic popup
          </Button>
        </Box>

        <Box className="rock-popup-showcase__reward">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Reward popup
          </Typography>
          <Button variant="contained" color="success" onClick={() => openPopup('reward')}>
            Open reward popup
          </Button>
        </Box>

        <Box className="rock-popup-showcase__confirm">
          <Typography variant="h6" sx={{ mb: 2 }}>
            Confirm popup
          </Typography>
          <Button variant="contained" color="error" onClick={() => openPopup('confirm')}>
            Open confirm popup
          </Button>
        </Box>
      </Stack>

      <RockPopup
        open={popups.center}
        onClose={() => closePopup('center')}
        title="Basic popup"
        variant="centerPop"
      >
        <Box className="rock-popup-showcase__preview-content" sx={{ py: 2 }}>
          <Typography>This is a simple popup preview.</Typography>
        </Box>
      </RockPopup>

      <RewardPopup
        open={popups.reward}
        onClose={() => closePopup('reward')}
        reward="Coins +500"
      />

      <ConfirmPopup
        open={popups.confirm}
        onClose={() => closePopup('confirm')}
        onConfirm={() => {
          closePopup('confirm')
        }}
        title="Delete task"
        message="This action cannot be undone."
      />
    </Container>
  )
}

export default RockPopupShowcase
