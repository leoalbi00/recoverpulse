import { ImageResponse } from "next/og";

import { BRAND_SURFACE, brandMarkDataUri } from "@/lib/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS applica da sé gli angoli arrotondati: sfondo pieno a tutto lato,
// senza il rect arrotondato del contenitore.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_SURFACE,
        }}
      >
        <img src={brandMarkDataUri({ size: 124 })} width={124} height={124} alt="" />
      </div>
    ),
    { ...size }
  );
}
