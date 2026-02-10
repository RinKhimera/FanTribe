import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FanTribe",
    short_name: "FanTribe",
    description: "Le réseau social des créateurs de contenus",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#6d4cf3",
    icons: [
      { src: "/images/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  }
}
