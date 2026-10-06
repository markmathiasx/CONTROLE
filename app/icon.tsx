import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#030712",
        backgroundImage:
          "radial-gradient(circle at top, rgba(37,99,235,0.32), transparent 55%), radial-gradient(circle at bottom right, rgba(99,102,241,0.22), transparent 35%)",
      }}
    >
      <div
        style={{
          display: "flex",
          height: 320,
          width: 320,
          borderRadius: 96,
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(180deg, rgba(37,99,235,0.22), rgba(99,102,241,0.16))",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#ecfeff",
          fontSize: 76,
          fontWeight: 700,
        }}
      >
        MMSVH
      </div>
    </div>,
    size,
  );
}
