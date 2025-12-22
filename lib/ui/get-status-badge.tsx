import { Badge } from "@/components/ui/badge"

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge className="border-yellow-500 bg-yellow-600 text-yellow-100 hover:bg-yellow-700">
          En attente
        </Badge>
      )
    case "approved":
      return (
        <Badge className="border-green-500 bg-green-600 text-green-100 hover:bg-green-700">
          Approuvée
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="border-red-500 bg-red-600 text-red-100 hover:bg-red-700">
          Rejetée
        </Badge>
      )
    default:
      return (
        <Badge className="border-gray-500 bg-gray-600 text-gray-100">
          {status}
        </Badge>
      )
  }
}
