import { HomePage } from "@/components/home/HomePage";

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

export default function Page() {
  return <HomePage dateLabel={dayFormatter.format(new Date())} />;
}
