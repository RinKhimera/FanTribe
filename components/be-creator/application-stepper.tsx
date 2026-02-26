"use client"

import { Camera, Crown, FileText, Send } from "lucide-react"
import { Stepper } from "@/components/shared/stepper"

const creatorSteps = [
  { title: "Introduction", icon: Crown },
  { title: "Informations", icon: FileText },
  { title: "Documents", icon: Camera },
  { title: "Soumission", icon: Send },
]

interface ApplicationStepperProps {
  currentStep: number
}

export const ApplicationStepper = ({ currentStep }: ApplicationStepperProps) => (
  <Stepper steps={creatorSteps} currentStep={currentStep} />
)
