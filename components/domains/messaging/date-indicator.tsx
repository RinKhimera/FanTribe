import { getRelativeDateTime, isSameDay } from "@/lib/formatters"
import { MessageProps } from "@/types"

type DateIndicatorProps = {
  message: MessageProps
  previousMessage?: MessageProps
}

export const DateIndicator = ({
  message,
  previousMessage,
}: DateIndicatorProps) => {
  return (
    <>
      {!previousMessage ||
      !isSameDay(previousMessage._creationTime, message._creationTime) ? (
        <div className="flex justify-center">
          <p className="bg-card text-muted-foreground z-50 mb-2 rounded-md p-1 text-sm">
            {getRelativeDateTime(message, previousMessage)}
          </p>
        </div>
      ) : null}
    </>
  )
}
