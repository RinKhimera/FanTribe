import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { DatePicker } from "@/components/ui/date-picker"

describe("DatePicker", () => {
  it("renders with placeholder when no value", () => {
    render(<DatePicker placeholder="Selectionner une date" />)
    expect(screen.getByText("Selectionner une date")).toBeInTheDocument()
  })

  it("displays formatted date in French when value is provided", () => {
    render(<DatePicker value="1990-05-15" />)
    expect(screen.getByText("15 mai 1990")).toBeInTheDocument()
  })

  it("opens calendar on button click", async () => {
    const user = userEvent.setup()
    render(<DatePicker />)

    await user.click(screen.getByRole("button"))

    expect(screen.getByRole("grid")).toBeInTheDocument()
  })

  it("calls onChange with ISO string when date is selected", async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(
      <DatePicker
        onChange={handleChange}
        fromYear={2000}
        toYear={2000}
      />
    )

    await user.click(screen.getByRole("button"))
    await user.click(screen.getByText("15"))

    expect(handleChange).toHaveBeenCalledWith("2000-01-15")
  })

  it("closes popover after selection", async () => {
    const user = userEvent.setup()
    render(<DatePicker fromYear={2000} toYear={2000} />)

    await user.click(screen.getByRole("button"))
    expect(screen.getByRole("grid")).toBeInTheDocument()

    await user.click(screen.getByText("15"))
    expect(screen.queryByRole("grid")).not.toBeInTheDocument()
  })

  it("is disabled when disabled prop is true", () => {
    render(<DatePicker disabled />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("displays calendar icon", () => {
    render(<DatePicker />)
    const button = screen.getByRole("button")
    expect(button.querySelector("svg")).toBeInTheDocument()
  })
})
