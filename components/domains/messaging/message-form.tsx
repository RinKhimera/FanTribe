"use client"

import { useMutation } from "convex/react"
import EmojiPicker, { Theme } from "emoji-picker-react"
import { Lock, Mic, RefreshCw, Send, Smile } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { logger } from "@/lib/config/logger"
import { cn } from "@/lib/utils"
import { MessagingPermissions } from "@/types"
import { MediaPopover } from "./media-popover"

type MessageFormProps = {
  conversationId: Id<"conversations">
  currentUser: Doc<"users"> | null
  permissions: MessagingPermissions | null
}

export const MessageForm = ({
  currentUser,
  conversationId,
  permissions,
}: MessageFormProps) => {
  const [msgText, setMsgText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sendMessage = useMutation(api.messaging.sendMessage)
  const setTypingIndicator = useMutation(api.messaging.setTypingIndicator)
  const setTypingIndicatorRef = useRef(setTypingIndicator)
  setTypingIndicatorRef.current = setTypingIndicator

  // Extraire les permissions (fallback conservatif)
  // Note: isLocked indique l'état de la conversation, mais canSend détermine si l'utilisateur peut envoyer
  // Un créateur peut avoir isLocked=true mais canSend=true (il peut envoyer même quand c'est verrouillé pour le user)
  const canSend = permissions?.canSend ?? false
  const canSendMedia = permissions?.canSendMedia ?? false
  // Utiliser !canSend pour déterminer si on doit afficher l'UI verrouillée
  const showLockedUI = !canSend

  // Gestion de l'indicateur de frappe
  const handleTyping = useCallback(() => {
    if (!currentUser || showLockedUI) return

    // Envoyer l'indicateur de frappe
    setTypingIndicatorRef.current({
      conversationId,
      isTyping: true,
    }).catch(() => {
      // Ignorer silencieusement les erreurs de typing
    })

    // Réinitialiser le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Arrêter l'indicateur après 3 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      setTypingIndicatorRef.current({
        conversationId,
        isTyping: false,
      }).catch(() => {})
    }, 3000)
  }, [currentUser, conversationId, showLockedUI])

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleSendTextMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!currentUser?._id || !msgText.trim() || isSending) return

    // Arrêter l'indicateur de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    setTypingIndicator({
      conversationId,
      isTyping: false,
    }).catch(() => {})

    setIsSending(true)

    try {
      await sendMessage({
        conversationId,
        content: msgText.trim(),
      })

      setMsgText("")
      inputRef.current?.focus()
    } catch (error) {
      logger.error("Failed to send message", error, {
        conversationId,
      })

      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue"

      if (errorMessage.includes("expiré") || errorMessage.includes("expired")) {
        toast.error("Abonnement expiré", {
          description:
            "Votre abonnement messagerie a expiré. Renouvelez pour continuer.",
        })
      } else {
        toast.error("Erreur d'envoi", {
          description: "Votre message n'a pas été envoyé. Veuillez réessayer.",
        })
      }
    } finally {
      setIsSending(false)
    }
  }

  // Message verrouillé - Afficher seulement si l'utilisateur ne peut pas envoyer
  // (Les créateurs peuvent envoyer même quand la conversation est verrouillée pour le user)
  if (showLockedUI) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-destructive/20 bg-destructive/5 sticky bottom-0 z-10 w-full border-t backdrop-blur-xl"
      >
        <div className="flex items-center justify-center gap-3 px-4 py-4">
          <div className="bg-destructive/10 flex size-10 items-center justify-center rounded-full">
            <Lock size={18} className="text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-destructive text-sm font-medium">
              {permissions?.reason === "no_messaging_subscription"
                ? "Abonnement messagerie expiré"
                : "Conversation verrouillée"}
            </p>
            <p className="text-muted-foreground text-xs">
              Renouvelez votre abonnement pour continuer
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-linear-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
          >
            <RefreshCw size={14} />
            Renouveler
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-background/80 sticky bottom-0 z-10 w-full border-t border-white/5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 p-3">
        {/* Actions à gauche */}
        <div className="flex items-center gap-1">
          {/* Emoji Picker */}
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "size-9 rounded-full transition-colors",
                  isEmojiOpen
                    ? "bg-amber-500/20 text-amber-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10",
                )}
              >
                <Smile size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto border-0 bg-transparent p-0 shadow-2xl"
              sideOffset={12}
              align="start"
            >
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(emojiObject) => {
                  setMsgText((prev) => prev + emojiObject.emoji)
                  inputRef.current?.focus()
                }}
                width={320}
                height={400}
              />
            </PopoverContent>
          </Popover>

          {/* Photos & Videos Picker (seulement pour les créateurs) */}
          {canSendMedia && <MediaPopover conversationId={conversationId} />}
        </div>

        {/* Input */}
        <form onSubmit={handleSendTextMessage} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Écrivez un message..."
              className="placeholder:text-muted-foreground/50 h-10 rounded-full border-white/10 bg-white/5 pr-4 pl-4 text-sm shadow-sm transition-all focus-visible:border-amber-500/30 focus-visible:ring-amber-500/20"
              value={msgText}
              onChange={(e) => {
                setMsgText(e.target.value)
                handleTyping()
              }}
              disabled={!canSend || isSending}
            />
          </div>

          {/* Bouton envoyer */}
          <AnimatePresence mode="wait">
            {msgText.trim().length > 0 ? (
              <motion.div
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="submit"
                  size="icon"
                  disabled={!canSend || isSending}
                  className="size-10 rounded-full bg-linear-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/25 transition-all hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/40 disabled:opacity-50"
                >
                  {isSending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="size-5 rounded-full border-2 border-black/30 border-t-black"
                    />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground size-10 rounded-full"
                  disabled
                >
                  <Mic size={20} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  )
}
