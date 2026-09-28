/** Pools de prénoms / noms fictifs par nationalité pour compléter les effectifs. */
type Pool = { first: string[]; last: string[] };

const pools: Record<string, Pool> = {
  USA: {
    first: ["Marcus", "Jalen", "Tyler", "Darius", "Malik", "Jordan", "Kyle", "Devin", "Isaiah", "Cameron", "Trevor", "Jaylen", "Brandon", "Chris", "Andre", "Terrence", "Justin", "Xavier", "Kendall", "DeShawn"],
    last: ["Johnson", "Williams", "Carter", "Thompson", "Robinson", "Mitchell", "Harris", "Bennett", "Coleman", "Walker", "Reed", "Hayes", "Simmons", "Brooks", "Foster", "Jenkins", "Patterson", "Ellis", "Ward", "Fields"],
  },
  FRA: {
    first: ["Théo", "Hugo", "Killian", "Mathis", "Enzo", "Bastien", "Lucas", "Axel", "Ilian", "Malcolm", "Sekou", "Moussa", "Yannick", "Antoine", "Rémi", "Ousmane", "Noah", "Ibrahima"],
    last: ["Diallo", "Lefèvre", "Traoré", "Morel", "Kamara", "Bouchard", "Girard", "Ndiaye", "Fontaine", "Mbaye", "Roussel", "Garnier", "Konaté", "Perrin", "Sissoko", "Marchand", "Cissé", "Vasseur"],
  },
  ESP: {
    first: ["Álvaro", "Sergio", "Pablo", "Jaime", "Marc", "Adrián", "Iker", "Rubén", "Guillem", "Joel", "Xavi", "Aleix", "Dani", "Ander", "Jorge", "Íñigo"],
    last: ["García", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Rodríguez", "Vidal", "Navarro", "Torres", "Ruiz", "Jiménez", "Vives", "Aguilar", "Ortiz", "Ibáñez"],
  },
  ITA: {
    first: ["Matteo", "Lorenzo", "Davide", "Alessandro", "Simone", "Marco", "Riccardo", "Tommaso", "Gabriele", "Andrea", "Stefano", "Federico", "Luca", "Niccolò"],
    last: ["Rossi", "Ricci", "Moretti", "Conti", "Bianchi", "Galli", "Marini", "Ferrari", "Romano", "Colombo", "Fontana", "Greco", "Vitali", "Barbieri"],
  },
  GER: {
    first: ["Jonas", "Lukas", "Maximilian", "Niklas", "Tim", "Leon", "Moritz", "Felix", "Elias", "Paul", "Justus", "Malte", "Tobias", "Julius"],
    last: ["Müller", "Schmidt", "Weber", "Fischer", "Wagner", "Becker", "Hoffmann", "Koch", "Richter", "Wolf", "Krüger", "Lange", "Vogel", "Brandt"],
  },
  GRE: {
    first: ["Giannis", "Nikos", "Dimitris", "Kostas", "Vassilis", "Georgios", "Panagiotis", "Michalis", "Thanasis", "Ioannis", "Alexandros", "Christos"],
    last: ["Papadopoulos", "Antoniou", "Nikolaou", "Georgiou", "Dimitriou", "Kalogeropoulos", "Vlachos", "Christou", "Makris", "Petrakis", "Manolas", "Sakellariou"],
  },
  TUR: {
    first: ["Emre", "Furkan", "Berk", "Kaan", "Yiğit", "Cem", "Mert", "Burak", "Ege", "Arda", "Tolga", "Ömer"],
    last: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Aydın", "Öztürk", "Arslan", "Doğan", "Kılıç", "Aslan", "Koç"],
  },
  SRB: {
    first: ["Nikola", "Marko", "Stefan", "Nemanja", "Filip", "Luka", "Aleksa", "Miloš", "Uroš", "Vanja", "Ognjen", "Dušan"],
    last: ["Jović", "Petrović", "Marković", "Nikolić", "Stojanović", "Ilić", "Pavlović", "Simić", "Popović", "Đorđević", "Lazić", "Milošević"],
  },
  LTU: {
    first: ["Tadas", "Rokas", "Lukas", "Mantas", "Dovydas", "Arnas", "Paulius", "Kristupas", "Marius", "Deividas", "Ignas", "Gytis"],
    last: ["Kazlauskas", "Petrauskas", "Jankauskas", "Stankevičius", "Balčiūnas", "Žukauskas", "Vasiliauskas", "Mikalauskas", "Butkus", "Grigonis", "Kairys", "Šimkus"],
  },
  ISR: {
    first: ["Yam", "Noam", "Itay", "Bar", "Gal", "Eitan", "Ori", "Niv", "Idan", "Shai", "Omer", "Nadav"],
    last: ["Cohen", "Levi", "Mizrahi", "Peretz", "Biton", "Avraham", "Friedman", "Malka", "Dahan", "Azoulay", "Hazan", "Segev"],
  },
  SLO: {
    first: ["Žiga", "Jaka", "Gregor", "Klemen", "Miha", "Rok", "Aljaž", "Matic", "Jan", "Nejc", "Tadej", "Blaž"],
    last: ["Novak", "Horvat", "Kovačič", "Krajnc", "Zupančič", "Potočnik", "Mlakar", "Vidmar", "Kos", "Hribar", "Rozman", "Zajc"],
  },
  CRO: {
    first: ["Ivan", "Mario", "Dario", "Ante", "Karlo", "Toni", "Marin", "Roko", "Bojan", "Josip", "Lovro", "Petar"],
    last: ["Kovačević", "Babić", "Marić", "Jurić", "Vuković", "Knežević", "Božić", "Šimić", "Perić", "Tomić", "Zorić", "Matić"],
  },
  AUS: {
    first: ["Jack", "Josh", "Matt", "Mitch", "Lachlan", "Cooper", "Ben", "Sam", "Will", "Riley", "Angus", "Callum"],
    last: ["Baxter", "Hamilton", "Fletcher", "Kearney", "McCarthy", "Sutherland", "Whitmore", "Hargreaves", "Bellamy", "Caldwell", "Dunbar", "Lonsdale"],
  },
  CAN: {
    first: ["Ethan", "Noah", "Liam", "Owen", "Devon", "Nate", "Jaden", "Cole", "Mason", "Elijah", "Caleb", "Tristan"],
    last: ["Tremblay", "Gagnon", "Lavoie", "Roy", "Fortin", "Campbell", "Anderson", "Gauthier", "Lachance", "Bergeron", "Pelletier", "Sinclair"],
  },
  BRA: {
    first: ["Gabriel", "Rafael", "Bruno", "Yago", "Leandro", "Matheus", "Felipe", "Vitor", "Caio", "Thiago", "Marcelo", "Guilherme"],
    last: ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Lima", "Carvalho", "Ribeiro", "Almeida", "Nascimento", "Moura", "Batista"],
  },
  LAT: {
    first: ["Artūrs", "Rihards", "Jānis", "Mārtiņš", "Kristers", "Toms", "Klāvs", "Anrijs", "Edgars", "Miks", "Kārlis", "Roberts"],
    last: ["Bērziņš", "Kalniņš", "Ozoliņš", "Jansons", "Liepiņš", "Krūmiņš", "Balodis", "Zariņš", "Eglītis", "Vītols", "Kļaviņš", "Siliņš"],
  },
  ARG: {
    first: ["Nicolás", "Juan", "Tomás", "Franco", "Gonzalo", "Mateo", "Agustín", "Máximo", "Joaquín", "Santiago", "Ignacio", "Bautista"],
    last: ["González", "Acosta", "Giménez", "Molina", "Herrera", "Medina", "Suárez", "Cabrera", "Benítez", "Ramírez", "Cáceres", "Villalba"],
  },
  NGA: {
    first: ["Chukwudi", "Emeka", "Obinna", "Ikenna", "Tunde", "Femi", "Kelechi", "Uche", "Chidi", "Olu", "Nnamdi", "Tobe"],
    last: ["Okafor", "Okonkwo", "Adeyemi", "Eze", "Nwosu", "Balogun", "Obi", "Okoro", "Chukwu", "Afolabi", "Oyelowo", "Ibrahim"],
  },
  ROU: {
    first: ["Andrei", "Mihai", "Alexandru", "Radu", "Bogdan", "Cristian", "Vlad", "Ionuț", "Rareș", "Sergiu"],
    last: ["Popescu", "Ionescu", "Dumitrescu", "Stan", "Radu", "Constantin", "Munteanu", "Marin", "Tudor", "Lazăr"],
  },
};

/** Nationalité → pool de noms (les micro-États réutilisent un pool voisin). */
const aliases: Record<string, string> = {
  MCO: "FRA",
  AND: "ESP",
  UAE: "SRB",
  GBR: "USA",
};

export function poolFor(country: string): Pool {
  return pools[country] ?? pools[aliases[country] ?? "USA"] ?? pools.USA;
}

/** Nationalités « d'import » plausibles pour un club européen. */
export const europeanImports = ["USA", "USA", "USA", "USA", "SRB", "LTU", "CAN", "AUS", "GRE", "ESP", "FRA", "GER", "ITA", "CRO", "SLO", "LAT", "NGA", "BRA", "ARG"];

/** Nationalités internationales plausibles pour un joueur NBA. */
export const nbaImports = ["FRA", "CAN", "AUS", "SRB", "GER", "ESP", "LTU", "SLO", "CRO", "NGA", "TUR", "ITA", "GRE", "LAT", "BRA", "ARG"];
