import React, { useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  Edit,
  Pencil,
  MoreHorizontal,
  File,
  Image,
  FileSpreadsheet,
  Presentation,
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
  FileAxis3d,
  Lock,
  MinusSquare,
} from "lucide-react";

interface SubMenuProps {
  show: boolean;
  index: number;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  items: ConvertItem[];
  parentRoute: string;
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
  route: string;
}

const SubMenu: React.FC<SubMenuProps> = ({
  show,
  index,
  onMouseEnter,
  onMouseLeave,
  items,
  parentRoute,
}) => {
  const location = useLocation();

  if (!show) return null;

  return (
    <div
      className="absolute left-[72px] w-64 bg-navy-700 border-l border-navy-600 shadow-lg z-50"
      style={{ top: `${index * 68}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {items.map((item, index) => (
        <Link
          key={index}
          to={`${parentRoute}/${item.route}`}
          className={`block ${
            location.pathname === `${parentRoute}/${item.route}`
              ? "bg-navy-600"
              : "hover:bg-navy-600"
          }`}
        >
          <div className="px-4 py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-800 rounded-lg">
                <item.icon className="text-gray-400" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-200 font-medium">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringSubmenu = useRef(false);

  const convertItems: ConvertItem[] = [
    {
      icon: File,
      label: "PDF Converter",
      description: "Convert any file to PDF format",
      route: "to-pdf",
    },
    {
      icon: FileText,
      label: "PDF ↔ Word",
      description: "Convert between PDF and Word",
      route: "word",
    },
    {
      icon: FileSpreadsheet,
      label: "PDF ↔ Excel",
      description: "Convert between PDF and Excel",
      route: "excel",
    },
    {
      icon: Presentation,
      label: "PDF ↔ PowerPoint",
      description: "Convert between PDF and PowerPoint",
      route: "powerpoint",
    },
    {
      icon: Image,
      label: "PDF ↔ Image",
      description: "Convert between PDF and images",
      route: "image",
    },
  ];

  const organizeItems: ConvertItem[] = [
    {
      icon: Combine,
      label: "Merge",
      description: "Combine multiple PDFs into one",
      route: "merge",
    },
    {
      icon: SplitIcon,
      label: "Split",
      description: "Split PDF into multiple files",
      route: "split",
    },
    {
      icon: RotateCw,
      label: "Rotate",
      description: "Rotate PDF pages",
      route: "rotate",
    },
    {
      icon: Trash,
      label: "Delete Pages",
      description: "Remove pages from PDF",
      route: "delete",
    },
    {
      icon: FileOutput,
      label: "Extract Pages",
      description: "Extract specific pages from PDF",
      route: "extract",
    },
  ];

  const editItems: ConvertItem[] = [
    {
      icon: Pencil,
      label: "Annotate",
      description: "Add annotations to PDF",
      route: "annotate",
    },
    // {
    //   icon: Type,
    //   label: "Edit Text",
    //   description: "Modify text in PDF",
    //   route: "text",
    // },
    {
      icon: Crop,
      label: "Crop",
      description: "Crop PDF pages",
      route: "crop",
    },
    {
      icon: FileSignature,
      label: "Redact",
      description: "Redact sensitive information",
      route: "redact",
    },
    {
      icon: Stamp,
      label: "Watermark",
      description: "Add watermark to PDF",
      route: "watermark",
    },
    {
      icon: Hash,
      label: "Number Pages",
      description: "Add page numbers to PDF",
      route: "number",
    },
  ];

  const moreItems: ConvertItem[] = [
    {
      icon: Lock,
      label: "Protect",
      description: "Add password protection to PDF",
      route: "protect",
    },
    {
      icon: Lock,
      label: "Unlock",
      description: "Remove PDF password protection",
      route: "unlock",
    },
    {
      icon: MinusSquare,
      label: "Flatten",
      description: "Flatten PDF annotations",
      route: "flatten",
    },
  ];

  const navItems: NavItem[] = [
    {
      href: "/compress",
      label: "Compress",
      icon: FileAxis3d,
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
      hasSubmenu: true,
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
      case "More":
        return moreItems;
      default:
        return [];
    }
  };

  const handleMouseEnter = (item: NavItem, index: number) => {
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

  const getParentRoute = (label: string): string => {
    switch (label) {
      case "Convert":
        return "/convert";
      case "Organize":
        return "/organize";
      case "Edit":
        return "/edit";
      case "More":
        return "/more";
      default:
        return "";
    }
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
                location.pathname === item.href ||
                location.pathname.startsWith(item.href + "/")
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
          parentRoute={getParentRoute(hoveredItem)}
        />
      )}
    </div>
  );
};

export default Sidebar;
