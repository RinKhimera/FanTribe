import { zodResolver } from "@hookform/resolvers/zod"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { Form } from "@/components/ui/form"
import { StepPersonalInfo } from "./step-personal-info"
import { ApplicationFormData, applicationSchema } from "./types"

// Mock framer-motion
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

// Mock DatePicker to avoid complex calendar interactions
vi.mock("@/components/ui/date-picker", () => ({
  DatePicker: ({
    onChange,
    placeholder,
  }: {
    onChange: (value: string) => void
    placeholder: string
  }) => (
    <input
      data-testid="date-picker"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

// Wrapper component that provides the form context
const TestWrapper = ({
  onNext,
  onPrevious,
  isValidating = false,
  defaultValues,
}: {
  onNext: () => void
  onPrevious: () => void
  isValidating?: boolean
  defaultValues?: Partial<ApplicationFormData>
}) => {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      address: "",
      whatsappNumber: "",
      mobileMoneyNumber: "",
      mobileMoneyNumber2: "",
      applicationReason: undefined,
      customReason: "",
      ...defaultValues,
    },
    mode: "onChange",
  })

  return (
    <Form {...form}>
      <form>
        <StepPersonalInfo
          form={form}
          onNext={onNext}
          onPrevious={onPrevious}
          isValidating={isValidating}
        />
      </form>
    </Form>
  )
}

describe("StepPersonalInfo", () => {
  it("should render all form fields", () => {
    render(<TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} />)

    expect(
      screen.getByText("Nom complet (le nom sur votre pièce d'identité)")
    ).toBeInTheDocument()
    expect(screen.getByText("Date de naissance")).toBeInTheDocument()
    expect(screen.getByText("Adresse complète")).toBeInTheDocument()
    expect(screen.getByText(/Numéro WhatsApp/)).toBeInTheDocument()
    expect(screen.getByText(/Numéro Mobile Money \(pour paiements\)/)).toBeInTheDocument()
  })

  it("should render the +237 phone prefix for all phone fields", () => {
    render(<TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} />)

    // There should be 3 phone fields with +237 prefix
    const prefixes = screen.getAllByText("+237")
    expect(prefixes).toHaveLength(3)
  })

  it("should call onPrevious when clicking back button", async () => {
    const user = userEvent.setup()
    const onPrevious = vi.fn()

    render(<TestWrapper onNext={vi.fn()} onPrevious={onPrevious} />)

    const backButton = screen.getByRole("button", { name: /retour/i })
    await user.click(backButton)

    expect(onPrevious).toHaveBeenCalledTimes(1)
  })

  it("should call onNext when clicking continue button", async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()

    render(<TestWrapper onNext={onNext} onPrevious={vi.fn()} />)

    const continueButton = screen.getByRole("button", { name: /continuer/i })
    await user.click(continueButton)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("should show loading state when isValidating is true", () => {
    render(
      <TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} isValidating={true} />
    )

    expect(screen.getByText("Validation...")).toBeInTheDocument()
  })

  it("should disable continue button when isValidating is true", () => {
    render(
      <TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} isValidating={true} />
    )

    const continueButton = screen.getByRole("button", { name: /validation/i })
    expect(continueButton).toBeDisabled()
  })

  it("should filter non-numeric characters from phone input", async () => {
    const user = userEvent.setup()

    render(<TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} />)

    // Get the first phone input (WhatsApp)
    const phoneInputs = screen.getAllByPlaceholderText("6XXXXXXXX")
    const phoneInput = phoneInputs[0]
    await user.type(phoneInput, "123abc456")

    expect(phoneInput).toHaveValue("123456")
  })

  it("should allow typing in the name field", async () => {
    const user = userEvent.setup()

    render(<TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} />)

    const nameInput = screen.getByPlaceholderText("Entrez votre nom complet")
    await user.type(nameInput, "John Doe")

    expect(nameInput).toHaveValue("John Doe")
  })

  it("should allow typing in the address field", async () => {
    const user = userEvent.setup()

    render(<TestWrapper onNext={vi.fn()} onPrevious={vi.fn()} />)

    const addressInput = screen.getByPlaceholderText(
      "Entrez votre adresse complète"
    )
    await user.type(addressInput, "123 Main Street, City")

    expect(addressInput).toHaveValue("123 Main Street, City")
  })
})
