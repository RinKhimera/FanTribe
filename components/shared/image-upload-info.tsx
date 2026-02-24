import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Info } from "lucide-react"

export const ImageUploadInfo = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size={"icon"} variant="ghost" className="rounded-full" aria-label="Informations">
          <Info size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="space-y-4 text-sm">
        <p className="text-sm">
          Les images de profil et de bannière sont limitées à 5 Mo. Les formats
          d&apos;image pris en charge sont JPG, JPEG, PNG et WEBP.
        </p>

        <p>
          Les tailles d&apos;image recommandées sont de 400x400 pixels pour la
          photo de profil et de 1500x500 pixels pour la photo de bannière.
        </p>
      </PopoverContent>
    </Popover>
  )
}
