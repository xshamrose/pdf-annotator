import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as Dialog from "@radix-ui/react-dialog";
import { FileText, Edit, Merge, Download, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Button = ({ variant = "primary", children, ...props }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    outline: "border-2 border-slate-200 hover:border-slate-300 text-slate-600",
  };

  return (
    <button
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

const FeatureCard = ({ children, onClick, ...props }) => (
  <div
    className="p-4 rounded-xl bg-white shadow-lg hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

const PDFLandingPage = () => {
  const navigate = useNavigate();

  const handleEditClick = () => {
    navigate("/upload");
  };

  return (
    <Tooltip.Provider>
      <Dialog.Root>
        <div className="h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col">
          {/* Hero Section */}
          <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  We make PDF easy.
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  All the tools you'll need to be more productive and work
                  smarter with documents.
                </p>
                <div className="flex gap-4">
                  <Dialog.Trigger asChild>
                    <Button variant="primary">Start Free Trial</Button>
                  </Dialog.Trigger>
                  <Button variant="outline">
                    Explore Tools
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hero Illustration */}
              <div className="relative">
                <div className="absolute -z-10 top-0 right-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-30" />
                <svg viewBox="0 0 400 300" className="w-full h-auto">
                  <rect
                    x="50"
                    y="50"
                    width="300"
                    height="200"
                    rx="10"
                    fill="#f8fafc"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                  <path d="M80 100 L320 100" stroke="#e2e8f0" strokeWidth="2" />
                  <path d="M80 150 L320 150" stroke="#e2e8f0" strokeWidth="2" />
                  <path d="M80 200 L320 200" stroke="#e2e8f0" strokeWidth="2" />
                  <circle
                    cx="200"
                    cy="150"
                    r="40"
                    fill="#3b82f6"
                    fillOpacity="0.1"
                  />
                  <path
                    d="M180 150 L220 150 M200 130 L200 170"
                    stroke="#3b82f6"
                    strokeWidth="4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  icon: <FileText className="h-5 w-5" />,
                  title: "View PDFs",
                  description:
                    "Open and view your PDF files with our fast and efficient viewer.",
                  tooltipText: "Support for all PDF formats",
                  onClick: handleEditClick,
                },
                {
                  icon: <Edit className="h-5 w-5" />,
                  title: "Edit & Annotate",
                  description:
                    "Make changes, add comments, and highlight text in your PDFs.",
                  tooltipText: "Multiple annotation tools available",
                  onClick: handleEditClick,
                },
                {
                  icon: <Merge className="h-5 w-5" />,
                  title: "Merge Files",
                  description:
                    "Combine multiple PDFs into a single document effortlessly.",
                  tooltipText: "Drag and drop to merge",
                  onClick: handleEditClick,
                },
                {
                  icon: <Download className="h-5 w-5" />,
                  title: "Export & Share",
                  description:
                    "Download your edited PDFs or share them with others.",
                  tooltipText: "Multiple export formats",
                  onClick: handleEditClick,
                },
              ].map((feature, index) => (
                <Tooltip.Root key={index}>
                  <Tooltip.Trigger asChild>
                    <FeatureCard onClick={feature.onClick}>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 text-blue-600">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </FeatureCard>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm"
                      sideOffset={5}
                    >
                      {feature.tooltipText}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </div>
          </div>
        </div>

        {/* Trial Dialog */}
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-[90vw] max-w-md shadow-xl animate-slide-up">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Start Your Free Trial
            </Dialog.Title>
            <Dialog.Description className="text-gray-600 mb-6">
              Try all features free for 14 days. No credit card required.
            </Dialog.Description>
            <div className="flex justify-end gap-4">
              <Dialog.Close asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.Close>
              <Button variant="primary">Start Trial</Button>
            </div>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>
  );
};

export default PDFLandingPage;
