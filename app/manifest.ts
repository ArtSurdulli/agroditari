import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AgroDitari",
    short_name: "AgroDitari",
    description:
      "Menaxhimi i të dhënave bujqësore për fermerë të vegjël.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbf9f6",
    theme_color: "#15803d",
    lang: "sq",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Paneli i AgroDitari në desktop",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "720x1280",
        type: "image/png",
        label: "Paneli i AgroDitari në celular",
      },
    ],
  };
}
