import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { StepIntroduction } from "@/components/be-creator/step-introduction"

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

describe("StepIntroduction", () => {
  it("should render the main title", () => {
    render(<StepIntroduction onNext={vi.fn()} />)

    expect(screen.getByText("Passez au compte Créateur")).toBeInTheDocument()
  })

  it("should render the 3 feature cards", () => {
    render(<StepIntroduction onNext={vi.fn()} />)

    expect(screen.getByText("Publier du contenu")).toBeInTheDocument()
    expect(screen.getByText("Contenu exclusif")).toBeInTheDocument()
    expect(screen.getByText("Monétisation")).toBeInTheDocument()
  })

  it("should render the verification steps", () => {
    render(<StepIntroduction onNext={vi.fn()} />)

    expect(screen.getByText("Remplir le formulaire")).toBeInTheDocument()
    expect(screen.getByText("Vérification d'identité")).toBeInTheDocument()
    expect(screen.getByText("Validation")).toBeInTheDocument()
  })

  it("should call onNext when clicking the start button", async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()

    render(<StepIntroduction onNext={onNext} />)

    const button = screen.getByRole("button", {
      name: /commencer ma candidature/i,
    })
    await user.click(button)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it("should display terms and privacy links", () => {
    render(<StepIntroduction onNext={vi.fn()} />)

    const termsLink = screen.getByRole("link", {
      name: /conditions d'utilisation/i,
    })
    const privacyLink = screen.getByRole("link", {
      name: /politique de confidentialité/i,
    })

    expect(termsLink).toHaveAttribute("href", "/terms")
    expect(privacyLink).toHaveAttribute("href", "/privacy")
  })
})
