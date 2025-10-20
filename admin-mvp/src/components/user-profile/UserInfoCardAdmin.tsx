"use client";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface UserInfoCardAdminProps {}

export default function UserInfoCardAdmin({}: UserInfoCardAdminProps) {
  return (
    <div className="bg-white p-5 border border-gray-200 rounded-2xl lg:p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800">
                Musharof
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800">
                Chowdhury
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800">
                randomuser@pimjo.com
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800">
                +09 363 398 46
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Bio
              </p>
              <p className="text-sm font-medium text-gray-800">
                Team Manager
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500">
                Account Status
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}