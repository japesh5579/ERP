import { ImageResponse } from "next/og"

export const size        = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 220,
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-12px",
            lineHeight: 1,
          }}
        >
          GT
        </div>
      </div>
    ),
    { ...size }
  )
}
