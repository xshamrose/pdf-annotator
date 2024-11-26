// components/layout/Header.tsx
import { ThemeToggle } from "../ui/theme-toggle";

const Header = () => {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">PDF Annotator</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
