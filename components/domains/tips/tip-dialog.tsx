"use client"

import {
  Coins,
  CreditCard,
  LoaderCircle,
  Shield,
  Smartphone,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { startStripeTipCheckout } from "@/actions/stripe/tip-checkout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Id } from "@/convex/_generated/dataModel"
import { useCinetpayPayment } from "@/hooks/useCinetpayPayment"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"

const TIP_PRESETS = [500, 1000, 2500, 5000, 10000] as const
const TIP_MIN = 500
const TIP_MAX = 100_000
const TIP_MESSAGE_MAX = 200

/** Flexible creator type — works with Doc<"users"> and ConversationParticipant */
type TipCreator = {
  _id: Id<"users">
  name: string
  username?: string
  image: string
  accountType?: string
}

type TipDialogProps = {
  isOpen?: boolean
  onClose?: () => void
  trigger?: React.ReactNode
  creator: TipCreator
  context?: "post" | "profile" | "message"
  postId?: Id<"posts">
  conversationId?: Id<"conversations">
}

export const TipDialog = ({
  isOpen: controlledIsOpen,
  onClose,
  trigger,
  creator,
  context,
  postId,
  conversationId,
}: TipDialogProps) => {
  const { currentUser } = useCurrentUser()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalOpen

  const [selectedAmount, setSelectedAmount] = useState<number>(1000)
  const [customAmount, setCustomAmount] = useState("")
  const [isCustom, setIsCustom] = useState(false)
  const [tipMessage, setTipMessage] = useState("")

  const { processPayment, isPending: isCinetpayPending } =
    useCinetpayPayment()
  const [isStripePending, startStripeTransition] = useTransition()

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      if (!open && onClose) onClose()
    } else {
      setInternalOpen(open)
    }
    if (!open) {
      setSelectedAmount(1000)
      setCustomAmount("")
      setIsCustom(false)
      setTipMessage("")
    }
  }

  const getAmount = (): number => {
    if (isCustom) {
      const parsed = parseInt(customAmount, 10)
      return isNaN(parsed) ? 0 : parsed
    }
    return selectedAmount
  }

  const isValidAmount = (): boolean => {
    const amount = getAmount()
    return amount >= TIP_MIN && amount <= TIP_MAX
  }

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount)
    setIsCustom(false)
    setCustomAmount("")
  }

  const handleCinetPayTip = () => {
    if (!currentUser || !creator || !isValidAmount()) return
    const amount = getAmount()

    const username = creator.username || creator.name

    processPayment({
      creatorId: creator._id,
      subscriberId: currentUser._id,
      creatorUsername: username,
      amount,
      description: `Pourboire pour ${username} - ${amount} XAF`,
      customFields: {
        type: "tip",
        senderId: currentUser._id,
        tipMessage: tipMessage || "",
        tipContext: context || "",
        postId: postId || "",
        conversationId: conversationId || "",
      },
    })
  }

  const handleStripeTip = () => {
    if (!currentUser || !creator || !isValidAmount()) return
    const amount = getAmount()

    startStripeTransition(async () => {
      try {
        const stripeUsername = creator.username || creator.name
        await startStripeTipCheckout({
          senderId: currentUser._id,
          creatorId: creator._id,
          creatorUsername: stripeUsername,
          amount,
          tipMessage: tipMessage || undefined,
          context,
          postId,
          conversationId,
        })
      } catch (error) {
        // Relancer les erreurs de redirection Next.js (comportement normal)
        if (isRedirectError(error)) {
          throw error
        }
        logger.error("Stripe tip checkout failed", error)
        toast.error("Impossible de démarrer le paiement Stripe")
      }
    })
  }

  const isPending = isCinetpayPending || isStripePending
  const amount = getAmount()

  const formatXAF = (n: number) =>
    new Intl.NumberFormat("fr-FR").format(n)

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-sm overflow-hidden border-amber-500/15 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-2 text-center">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative mx-auto"
          >
            <div className="relative inline-block">
              <Avatar className="mx-auto size-20 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-background">
                <AvatarImage
                  src={creator.image}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted text-xl">
                  {creator.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <motion.div
                className="absolute -right-1 -bottom-1 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 p-1.5 shadow-lg"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Coins className="size-3.5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <DialogTitle className="mt-3 text-lg font-bold">
              Envoyer un pourboire
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1 text-sm">
              Soutenez {creator.name} avec un pourboire
            </DialogDescription>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          className="space-y-4 px-6 pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Preset amounts grid */}
          <div className="grid grid-cols-3 gap-2">
            {TIP_PRESETS.map((preset) => (
              <motion.button
                key={preset}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  "rounded-xl border p-2.5 text-center text-sm font-semibold transition-all",
                  !isCustom && selectedAmount === preset
                    ? "border-amber-500/60 bg-amber-500/10 text-amber-500 shadow-sm shadow-amber-500/10"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:border-amber-500/30 hover:text-foreground",
                )}
              >
                {formatXAF(preset)}
              </motion.button>
            ))}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsCustom(true)}
              className={cn(
                "rounded-xl border p-2.5 text-center text-sm font-semibold transition-all",
                isCustom
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-500 shadow-sm shadow-amber-500/10"
                  : "border-white/10 bg-white/5 text-muted-foreground hover:border-amber-500/30 hover:text-foreground",
              )}
            >
              Autre
            </motion.button>
          </div>

          {/* Custom amount input */}
          <AnimatePresence>
            {isCustom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={`Min. ${formatXAF(TIP_MIN)} XAF`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min={TIP_MIN}
                    max={TIP_MAX}
                    className="pr-14 text-center text-lg font-semibold"
                    autoFocus
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium">
                    XAF
                  </span>
                </div>
                {customAmount && parseInt(customAmount) < TIP_MIN && (
                  <p className="text-destructive mt-1.5 text-xs">
                    Minimum {formatXAF(TIP_MIN)} XAF
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Optional message */}
          <div>
            <Textarea
              placeholder="Ajouter un message (optionnel)"
              value={tipMessage}
              onChange={(e) =>
                setTipMessage(e.target.value.slice(0, TIP_MESSAGE_MAX))
              }
              maxLength={TIP_MESSAGE_MAX}
              className="min-h-[60px] resize-none text-sm"
              rows={2}
            />
            {tipMessage.length > 0 && (
              <p className="text-muted-foreground mt-1 text-right text-xs">
                {tipMessage.length}/{TIP_MESSAGE_MAX}
              </p>
            )}
          </div>

          {/* Amount display */}
          <AnimatePresence mode="wait">
            {isValidAmount() && (
              <motion.div
                key={amount}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <div className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-3xl font-bold text-transparent">
                  {formatXAF(amount)} XAF
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment buttons */}
          <div className="space-y-2.5">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className={cn(
                  "w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-500/95 to-orange-500 text-base font-semibold",
                  "shadow-lg shadow-amber-500/20 transition-shadow hover:shadow-xl hover:shadow-amber-500/30",
                  { "pointer-events-none opacity-70": isPending },
                )}
                onClick={handleCinetPayTip}
                disabled={isPending || !isValidAmount()}
                size="lg"
              >
                {isCinetpayPending ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="size-5 animate-spin" />
                    Traitement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Smartphone className="size-5" />
                    Payer avec OM/MOMO
                  </span>
                )}
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                variant="outline"
                className={cn(
                  "w-full rounded-xl border-amber-500/25 text-base font-semibold backdrop-blur-sm",
                  "transition-colors hover:border-amber-500/40 hover:bg-amber-500/5",
                  { "pointer-events-none opacity-70": isPending },
                )}
                onClick={handleStripeTip}
                disabled={isPending || !isValidAmount()}
                size="lg"
              >
                {isStripePending ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="size-5 animate-spin" />
                    Redirection...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CreditCard className="size-5" />
                    Payer avec carte
                  </span>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
            <Shield className="size-3.5" />
            <span>Paiement sécurisé</span>
            <span>•</span>
            <span>Privé</span>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
