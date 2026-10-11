import { Fraunces, Poppins } from "next/font/google";

// Poppins carries the interface, labels and offers; Fraunces is the logo's family, for display titles.
export const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700", "800"],
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "900"],
});
