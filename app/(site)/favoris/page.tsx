import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "Favoris",
  description: "Vos équipes, joueurs et compétitions suivis, avec leurs matchs en direct, à venir et récents.",
};

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Favoris</h1>
        <p className="text-sm text-fg-muted">Enregistrés dans ce navigateur, sans compte.</p>
      </div>
      <FavoritesList />
    </div>
  );
}
