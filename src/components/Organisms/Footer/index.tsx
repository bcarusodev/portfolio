import { Brand } from "../../Atoms/Brand";
import { FooterNotes } from "../../Molecules/FooterNotes";
import { SocialIcons } from "../../Molecules/SocialIcons";

export default function Footer() {
  return (
    <footer className="bg-transparent text-gray-700 dark:text-gray-200 backdrop-blur-xl shadow-2xl border-t">
      <div className="max-w-6xl mx-auto py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <Brand onlyLogo />
        <FooterNotes />
        <SocialIcons />
      </div>
    </footer>
  );
}
