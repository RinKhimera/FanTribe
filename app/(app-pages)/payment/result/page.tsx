import { use } from "react"
import { PaymentResult } from "@/components/domains/payment/payment-result"
import { isPaymentTestMode } from "@/lib/config/payment-test"

const PaymentResultPage = (props: {
  searchParams: Promise<{
    status?: string
    username?: string
    reason?: string
    transaction?: string
    type?: string
    provider?: string
    session_id?: string
    code?: string
  }>
}) => {
  const params = use(props.searchParams)
  const testMode = isPaymentTestMode()

  return <PaymentResult params={params} testMode={testMode} />
}

export default PaymentResultPage
