"use server"

import { Resend } from "resend"
import { env } from "@/lib/env"
import { ReportEmailTemplate } from "@/templates/report-email-template"

const resend = new Resend(env.RESEND_API_KEY)

interface SendReportEmailProps {
  reportType: "user" | "post" | "comment"
  reason: string
  description?: string
  reporterUsername: string
  reportedUsername?: string
  reportedContent?: string
  // reportId: string
}

export async function sendReportEmail({
  reportType,
  reason,
  description,
  reporterUsername,
  reportedUsername,
  reportedContent,
  // reportId,
}: SendReportEmailProps) {
  try {
    const { data, error } = await resend.emails.send({
      from: "FanTribe Support <support@fantribe.io>",
      to: ["dixiades@gmail.com", "willnimp@gmail.com", "jlombat@gmail.com"],
      subject: `🚨 Nouveau signalement ${reportType} - ${reason}`,
      react: ReportEmailTemplate({
        reportType,
        reason,
        description,
        reporterUsername,
        reportedUsername,
        reportedContent,
        // reportId,
      }),
    })

    if (error) {
      console.error("Erreur lors de l'envoi de l'email de signalement:", error)
      return { success: false, error }
    }

    console.log("Email de signalement envoyé avec succès:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de signalement:", error)
    return { success: false, error }
  }
}
