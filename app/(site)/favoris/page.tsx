import type { Metadata } from "next";
import { FavoritesList } from "@/components/favorites/FavoritesList";

export const metadata: Metadata = {
  title: "Favoris",
  description: "Vos équipes, joueurs et compétitions suivis, avec leurs matchs en direct, à venir et récents.",
};

export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">Favoris</h1>
        <p className="mt-2 text-sm text-fg-muted">Enregistrés dans ce navigateur, sans compte.</p>
      </div>
      <FavoritesList />
    </div>
  );
}
