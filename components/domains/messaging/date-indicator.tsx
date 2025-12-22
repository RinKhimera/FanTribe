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
          <p className="dark:bg-muted z-50 mb-2 rounded-md bg-white p-1 text-sm text-gray-500 dark:text-gray-400">
            {getRelativeDateTime(message, previousMessage)}
          </p>
        </div>
      ) : null}
    </>
  )
}
