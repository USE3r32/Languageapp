'use client';

import { UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <UserProfile
          appearance={{
            elements: {
              card: "shadow-lg border border-gray-200",
              navbar: "bg-white border-b border-gray-200",
              navbarButton: "text-gray-700 hover:text-black hover:bg-gray-50",
              navbarButtonIcon: "text-gray-500",
              profileSection: "bg-white",
              profileSectionTitle: "text-black font-semibold",
              profileSectionContent: "text-gray-700",
              formButtonPrimary: "bg-green-400 hover:bg-green-500 text-black font-semibold",
              formFieldInput: "border-gray-300 focus:border-green-400 focus:ring-green-400",
              badge: "bg-green-100 text-green-800",
            },
            variables: {
              colorPrimary: "#00ff00",
              colorBackground: "#ffffff",
              colorText: "#000000",
              borderRadius: "0.5rem",
            }
          }}
          routing="path"
          path="/user-profile"
        />
      </div>
    </div>
  );
}