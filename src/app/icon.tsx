import { ImageResponse } from "next/og";

import { BRAND_SURFACE, brandMarkDataUri } from "@/lib/brand";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// A 32px il marchio occupa più spazio che nelle app icon (markScale 0.84):
// nelle tab del browser i dettagli sotto i 20px si perdono.
export default function Icon() {
  return new ImageResponse(
    <img
      src={brandMarkDataUri({ size: 32, background: BRAND_SURFACE, markScale: 0.84 })}
      width={32}
      height={32}
      alt=""
    />,
    { ...size }
  );
}
