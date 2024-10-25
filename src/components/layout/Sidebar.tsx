import React, { useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  Edit,
  Pencil,
  MoreHorizontal,
  FileDown,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
  // Scissors,
  Crop,
  Type,
  FileSignature,
  Stamp,
  Hash,
  Combine,
  Split as SplitIcon,
  RotateCw,
  Trash,
  FileOutput,
} from "lucide-react";
interface SubMenuProps {
  show: boolean;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  items: ConvertItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  width: string;
  hasSubmenu?: boolean;
}

interface ConvertItem {
  icon: React.ElementType;
  label: string;
  description: string;
}

const SubMenu: React.FC<SubMenuProps> = ({
  show,
  index,
  onMouseEnter,
  onMouseLeave,
  items,
}) => {
  if (!show) return null;

  return (
    <div
      className="absolute left-[72px] w-64 bg-navy-700 border-l border-navy-600 shadow-lg z-50"
      style={{ top: `${index * 68}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => (
        <div key={index} className="px-4 py-3 hover:bg-navy-600 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy-800 rounded-lg">
              <item.icon className="text-gray-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-200 font-medium">{item.label}</p>
              <p className="text-xs text-gray-400">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  // const [submenuTimeout, setSubmenuTimeout] = useState<NodeJS.Timeout | null>(
  //   null
  // );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringSubmenu = useRef(false);
  const convertItems: ConvertItem[] = [
    {
      icon: File,
      label: "PDF Converter",
      description: "Convert any file to PDF format",
    },
    {
      icon: FileText,
      label: "PDF ↔ Word",
      description: "Convert between PDF and Word",
    },
    {
      icon: FileSpreadsheet,
      label: "PDF ↔ Excel",
      description: "Convert between PDF and Excel",
    },
    {
      icon: Presentation,
      label: "PDF ↔ PowerPoint",
      description: "Convert between PDF and PowerPoint",
    },
    {
      icon: Image,
      label: "PDF ↔ Image",
      description: "Convert between PDF and images",
    },
  ];

  const organizeItems: ConvertItem[] = [
    {
      icon: Combine,
      label: "Merge",
      description: "Combine multiple PDFs into one",
    },
    {
      icon: SplitIcon,
      label: "Split",
      description: "Split PDF into multiple files",
    },
    {
      icon: RotateCw,
      label: "Rotate",
      description: "Rotate PDF pages",
    },
    {
      icon: Trash,
      label: "Delete Pages",
      description: "Remove pages from PDF",
    },
    {
      icon: FileOutput,
      label: "Extract Pages",
      description: "Extract specific pages from PDF",
    },
  ];

  const editItems: ConvertItem[] = [
    {
      icon: Pencil,
      label: "Annotate",
      description: "Add annotations to PDF",
    },
    {
      icon: Type,
      label: "Edit Text",
      description: "Modify text in PDF",
    },
    {
      icon: Crop,
      label: "Crop",
      description: "Crop PDF pages",
    },
    {
      icon: FileSignature,
      label: "Redact",
      description: "Redact sensitive information",
    },
    {
      icon: Stamp,
      label: "Watermark",
      description: "Add watermark to PDF",
    },
    {
      icon: Hash,
      label: "Number Pages",
      description: "Add page numbers to PDF",
    },
  ];

  const navItems: NavItem[] = [
    {
      href: "/compress",
      label: "Compress",
      icon: FileDown,
      width: "34px",
    },
    {
      href: "/convert",
      label: "Convert",
      icon: FileText,
      width: "33px",
      hasSubmenu: true,
    },
    {
      href: "/organize",
      label: "Organize",
      icon: FolderOpen,
      width: "33px",
      hasSubmenu: true,
    },
    {
      href: "/edit",
      label: "Edit",
      icon: Edit,
      width: "33px",
      hasSubmenu: true,
    },
    {
      href: "/sign",
      label: "Sign",
      icon: Pencil,
      width: "33px",
    },
    {
      href: "/more",
      label: "More",
      icon: MoreHorizontal,
      width: "33px",
    },
    {
      href: "/documents",
      label: "Documents",
      icon: FileText,
      width: "33px",
    },
  ];

  const getSubmenuItems = (label: string): ConvertItem[] => {
    switch (label) {
      case "Convert":
        return convertItems;
      case "Organize":
        return organizeItems;
      case "Edit":
        return editItems;
      default:
        return [];
    }
  };

  const handleMouseEnter = (item: NavItem, index: number) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (item.hasSubmenu) {
      setHoveredIndex(index);
      setHoveredItem(item.label);
    }
  };

  const handleMouseLeave = () => {
    // Only start the hiding timeout if we're not hovering the submenu
    if (!isHoveringSubmenu.current) {
      timeoutRef.current = setTimeout(() => {
        setHoveredItem(null);
      }, 100);
    }
  };

  const handleSubmenuMouseEnter = () => {
    isHoveringSubmenu.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleSubmenuMouseLeave = () => {
    isHoveringSubmenu.current = false;
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 100);
  };

  return (
    <div className="relative">
      <aside className="w-[72px] bg-navy-800 min-h-screen flex flex-col items-center pt-4 z-40">
        {navItems.map((item, index) => (
          <Link
            key={item.href}
            to={item.href}
            className={`w-full flex flex-col items-center justify-center py-3 cursor-pointer
              ${
                location.pathname === item.href
                  ? "bg-navy-700"
                  : "hover:bg-navy-700"
              }
              transition-colors duration-200 relative`}
            onMouseEnter={() => handleMouseEnter(item, index)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex flex-col items-center gap-1">
              <item.icon className="text-gray-400" size={20} />
              <span className="text-[10px] text-gray-400">{item.label}</span>
            </div>
          </Link>
        ))}
      </aside>
      {hoveredItem && (
        <SubMenu
          show={!!hoveredItem}
          index={hoveredIndex}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
          items={getSubmenuItems(hoveredItem)}
        />
      )}
    </div>
  );
};

export default Sidebar;
