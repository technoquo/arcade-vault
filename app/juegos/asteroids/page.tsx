import type { Metadata } from "next";
import Link from "next/link";
import AsteroidsGame from "@/components/AsteroidsGame";

export const metadata: Metadata = {
  title: "Asteroids | Arcade Vault",
  description: "Destruye asteroides y sobrevive el mayor tiempo posible.",
};

export default function AsteroidsPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - var(--nav-h, 64px))",
      }}
    >
      <div style={{ padding: "12px 24px" }}>
        <Link
          href="/juegos"
          style={{ color: "var(--ink-faint)", fontSize: 14, textDecoration: "none" }}
        >
          ← Juegos
        </Link>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AsteroidsGame />
      </div>
    </div>
  );
}
