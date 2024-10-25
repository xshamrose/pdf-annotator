// components/layout/Layout.tsx
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showSidebar = location.pathname !== "/";

  return (
    <div className=" flex flex-col bg-background text-foreground">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 bg-background text-foreground">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
