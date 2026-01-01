import { zodResolver } from "@hookform/resolvers/zod"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm } from "react-hook-form"
import { describe, expect, it, vi } from "vitest"
import { Form } from "@/components/ui/form"
import { StepDocuments } from "./step-documents"
import {
  ApplicationFormData,
  applicationSchema,
  UploadedDocuments,
} from "./types"

// Mock framer-motion
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      onPointerDown,
      ...props
    }: React.PropsWithChildren<{
      onPointerDown?: () => void
      [key: string]: unknown
    }>) => (
      <div {...props} onPointerDown={onPointerDown}>
        {children}
      </div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...props}>{children}</p>
    ),
  },
}))

// Mock BunnyUploadWidget
vi.mock("@/components/shared/bunny-upload-widget", () => ({
  BunnyUploadWidget: ({
    children,
  }: {
    children: (props: { open: () => void }) => React.ReactNode
  }) => <div data-testid="upload-widget">{children({ open: vi.fn() })}</div>,
}))

// Wrapper component that provides the form context
const TestWrapper = ({
  onPrevious,
  onSubmit,
  isSubmitting = false,
  uploadedDocuments = {},
  onUploadSuccess = vi.fn(),
  onRemoveDocument = vi.fn(),
  defaultValues,
}: {
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting?: boolean
  uploadedDocuments?: UploadedDocuments
  onUploadSuccess?: () => void
  onRemoveDocument?: (type: "identityCard" | "selfie") => void
  defaultValues?: Partial<ApplicationFormData>
}) => {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: "John Doe",
      dateOfBirth: "1990-01-01",
      address: "123 Main Street",
      phoneNumber: "123456789",
      applicationReason: undefined,
      customReason: "",
      ...defaultValues,
    },
    mode: "onChange",
  })

  return (
    <Form {...form}>
      <form>
        <StepDocuments
          form={form}
          userId="test-user-id"
          uploadedDocuments={uploadedDocuments}
          onUploadSuccess={onUploadSuccess}
          onRemoveDocument={onRemoveDocument}
          onPrevious={onPrevious}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  )
}

describe("StepDocuments", () => {
  describe("Document Upload Section", () => {
    it("should render upload zones for identity card and selfie", () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      expect(
        screen.getByText("Pièce d'identité (carte, passeport, permis)")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Selfie avec votre pièce d'identité")
      ).toBeInTheDocument()
    })

    it("should show upload button when no document is uploaded", () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      expect(screen.getByText("Cliquez pour uploader")).toBeInTheDocument()
      expect(
        screen.getByText("Cliquez pour prendre un selfie")
      ).toBeInTheDocument()
    })

    it("should show success message when identity card is uploaded", () => {
      const uploadedDocuments: UploadedDocuments = {
        identityCard: {
          url: "https://example.com/id.jpg",
          mediaId: "id-123",
          uploadedAt: Date.now(),
        },
      }

      render(
        <TestWrapper
          onPrevious={vi.fn()}
          onSubmit={vi.fn()}
          uploadedDocuments={uploadedDocuments}
        />
      )

      expect(screen.getByText("Document d'identité uploadé")).toBeInTheDocument()
    })

    it("should show success message when selfie is uploaded", () => {
      const uploadedDocuments: UploadedDocuments = {
        selfie: {
          url: "https://example.com/selfie.jpg",
          mediaId: "selfie-123",
          uploadedAt: Date.now(),
        },
      }

      render(
        <TestWrapper
          onPrevious={vi.fn()}
          onSubmit={vi.fn()}
          uploadedDocuments={uploadedDocuments}
        />
      )

      expect(screen.getByText("Selfie uploadé")).toBeInTheDocument()
    })
  })

  describe("Motivation Selection", () => {
    it("should render all motivation options", () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      expect(screen.getByText("Monétiser mon contenu")).toBeInTheDocument()
      expect(screen.getByText("Partager ma passion")).toBeInTheDocument()
      expect(screen.getByText("Autre raison")).toBeInTheDocument()
    })

    it("should select a motivation option when clicked", async () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      const monetisationOption = screen.getByText("Monétiser mon contenu")
      // Use pointerDown to match the component behavior
      fireEvent.pointerDown(monetisationOption.closest("div[class*='cursor-pointer']")!)

      const radioButton = screen.getByRole("radio", { name: /monétiser mon contenu/i })
      expect(radioButton).toBeChecked()
    })

    it("should show custom reason textarea when 'autre' is selected", async () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      const autreOption = screen.getByText("Autre raison")
      fireEvent.pointerDown(autreOption.closest("div[class*='cursor-pointer']")!)

      expect(screen.getByText("Précisez votre motivation")).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText("Décrivez votre motivation spécifique...")
      ).toBeInTheDocument()
    })

    it("should allow changing from 'autre' to another option (regression test for radio bug)", async () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      // First select "autre"
      const autreOption = screen.getByText("Autre raison")
      fireEvent.pointerDown(autreOption.closest("div[class*='cursor-pointer']")!)

      // Verify textarea appears
      expect(screen.getByText("Précisez votre motivation")).toBeInTheDocument()

      // Now select a different option
      const monetisationOption = screen.getByText("Monétiser mon contenu")
      fireEvent.pointerDown(monetisationOption.closest("div[class*='cursor-pointer']")!)

      // Verify the new option is selected
      const radioButton = screen.getByRole("radio", { name: /monétiser mon contenu/i })
      expect(radioButton).toBeChecked()

      // Verify textarea is hidden
      expect(
        screen.queryByText("Précisez votre motivation")
      ).not.toBeInTheDocument()
    })
  })

  describe("Navigation", () => {
    it("should call onPrevious when clicking back button", async () => {
      const user = userEvent.setup()
      const onPrevious = vi.fn()

      render(<TestWrapper onPrevious={onPrevious} onSubmit={vi.fn()} />)

      const backButton = screen.getByRole("button", { name: /retour/i })
      await user.click(backButton)

      expect(onPrevious).toHaveBeenCalledTimes(1)
    })

    it("should disable submit button when documents are incomplete", () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      const submitButton = screen.getByRole("button", {
        name: /soumettre ma candidature/i,
      })
      expect(submitButton).toBeDisabled()
    })

    it("should enable submit button when both documents are uploaded", () => {
      const uploadedDocuments: UploadedDocuments = {
        identityCard: {
          url: "https://example.com/id.jpg",
          mediaId: "id-123",
          uploadedAt: Date.now(),
        },
        selfie: {
          url: "https://example.com/selfie.jpg",
          mediaId: "selfie-123",
          uploadedAt: Date.now(),
        },
      }

      render(
        <TestWrapper
          onPrevious={vi.fn()}
          onSubmit={vi.fn()}
          uploadedDocuments={uploadedDocuments}
        />
      )

      const submitButton = screen.getByRole("button", {
        name: /soumettre ma candidature/i,
      })
      expect(submitButton).not.toBeDisabled()
    })

    it("should call onSubmit when clicking submit button with complete documents", async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      const uploadedDocuments: UploadedDocuments = {
        identityCard: {
          url: "https://example.com/id.jpg",
          mediaId: "id-123",
          uploadedAt: Date.now(),
        },
        selfie: {
          url: "https://example.com/selfie.jpg",
          mediaId: "selfie-123",
          uploadedAt: Date.now(),
        },
      }

      render(
        <TestWrapper
          onPrevious={vi.fn()}
          onSubmit={onSubmit}
          uploadedDocuments={uploadedDocuments}
        />
      )

      const submitButton = screen.getByRole("button", {
        name: /soumettre ma candidature/i,
      })
      await user.click(submitButton)

      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it("should show loading state when isSubmitting is true", () => {
      const uploadedDocuments: UploadedDocuments = {
        identityCard: {
          url: "https://example.com/id.jpg",
          mediaId: "id-123",
          uploadedAt: Date.now(),
        },
        selfie: {
          url: "https://example.com/selfie.jpg",
          mediaId: "selfie-123",
          uploadedAt: Date.now(),
        },
      }

      render(
        <TestWrapper
          onPrevious={vi.fn()}
          onSubmit={vi.fn()}
          uploadedDocuments={uploadedDocuments}
          isSubmitting={true}
        />
      )

      expect(screen.getByText("Soumission en cours...")).toBeInTheDocument()
    })

    it("should show warning message when documents are incomplete", () => {
      render(<TestWrapper onPrevious={vi.fn()} onSubmit={vi.fn()} />)

      expect(
        screen.getByText(
          "Veuillez uploader les deux documents requis pour continuer"
        )
      ).toBeInTheDocument()
    })
  })
})
